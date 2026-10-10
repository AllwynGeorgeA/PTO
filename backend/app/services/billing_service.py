"""Dodo Payments billing: plans, checkout sessions, webhook verification and handling.

Unverified against a live account: product ids come from env DODO_PRODUCT_ID_PRO /
DODO_PRODUCT_ID_TEAM, and the exact subscription event payload fields.
"""

import base64
import hashlib
import hmac
import json
import logging
import os
import time
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.exceptions import AppError
from app.models import Subscription, User

logger = logging.getLogger(__name__)

# Live host; Dodo test-mode keys use https://test.dodopayments.com (set DODO_BASE_URL).
DODO_BASE_URL = os.environ.get("DODO_BASE_URL", "https://live.dodopayments.com")
DODO_CHECKOUT_PATH = "/checkouts"
WEBHOOK_TOLERANCE_SECONDS = 300

PLANS: list[dict[str, object]] = [
    {
        "id": "free",
        "name": "Free",
        "price": 0,
        "features": ["5 AI replies per month", "PTO planner", "Handover assistant"],
    },
    {
        "id": "pro",
        "name": "Pro",
        "price": 4.99,
        "features": [
            "Unlimited AI replies",
            "PTO planner",
            "Handover assistant",
            "Email reminders",
        ],
    },
    {
        "id": "team",
        "name": "Team",
        "price": 19,
        "features": ["Everything in Pro", "Up to 10 users"],
    },
]

_EVENT_STATUS = {
    "subscription.active": "active",
    "subscription.renewed": "active",
    "subscription.cancelled": "cancelled",
    "subscription.expired": "expired",
}


def _product_id(plan: str) -> str:
    return os.environ.get(f"DODO_PRODUCT_ID_{plan.upper()}", "")


def verify_signature(headers: dict[str, str], body: bytes, now: float | None = None) -> bool:
    """Verify a Standard Webhooks signature. False if secret unset, stale or mismatched."""
    secret = settings.DODO_WEBHOOK_SECRET
    msg_id = headers.get("webhook-id", "")
    ts = headers.get("webhook-timestamp", "")
    sigs = headers.get("webhook-signature", "")
    if not (secret and msg_id and ts and sigs):
        return False
    try:
        if abs((now if now is not None else time.time()) - int(ts)) > WEBHOOK_TOLERANCE_SECONDS:
            return False
        key = base64.b64decode(secret[6:]) if secret.startswith("whsec_") else secret.encode()
    except ValueError:
        return False
    signed = f"{msg_id}.{ts}.".encode() + body
    expected = base64.b64encode(hmac.new(key, signed, hashlib.sha256).digest()).decode()
    return any(
        hmac.compare_digest(expected, part.split(",", 1)[1])
        for part in sigs.split()
        if part.startswith("v1,")
    )


async def create_checkout(user: User, plan: str) -> str:
    """Create a Dodo checkout session and return its URL (live mode only)."""
    product_id = _product_id(plan)
    if not product_id:
        raise AppError(f"Product id for plan '{plan}' is not configured")
    return_url = f"{settings.ALLOWED_ORIGINS[0]}/dashboard" if settings.ALLOWED_ORIGINS else None
    payload = {
        "product_cart": [{"product_id": product_id, "quantity": 1}],
        "customer": {"email": user.email, "name": user.full_name or user.email},
        "return_url": return_url,
        "metadata": {"user_id": str(user.id), "plan": plan},
    }
    try:
        async with httpx.AsyncClient(base_url=DODO_BASE_URL, timeout=15) as http:
            resp = await http.post(
                DODO_CHECKOUT_PATH,
                json=payload,
                headers={"Authorization": f"Bearer {settings.DODO_API_KEY}"},
            )
            resp.raise_for_status()
            url = resp.json().get("checkout_url")
    except (httpx.HTTPError, ValueError):
        logger.exception("Dodo checkout creation failed")
        raise AppError("Could not create checkout session") from None
    if not url:
        raise AppError("Could not create checkout session")
    return str(url)


def get_subscription(db: Session, user_id: int) -> Subscription | None:
    """Latest subscription row for a user."""
    return db.scalars(
        select(Subscription).where(Subscription.user_id == user_id).order_by(Subscription.id.desc())
    ).first()


def _parse_dt(value: object) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _plan_for_product(product_id: object) -> str | None:
    for plan in ("pro", "team"):
        if product_id and product_id == _product_id(plan):
            return plan
    return None


def handle_event(db: Session, event: dict[str, object]) -> bool:
    """Apply a verified event to Subscription and User.plan. Idempotent: state is set, not added."""
    status = _EVENT_STATUS.get(str(event.get("type")))
    data = event.get("data")
    if status is None or not isinstance(data, dict):
        return False
    meta = data.get("metadata")
    meta = meta if isinstance(meta, dict) else {}
    sub_id = data.get("subscription_id")
    sub = (
        db.scalars(select(Subscription).where(Subscription.dodo_subscription_id == sub_id)).first()
        if sub_id
        else None
    )
    user: User | None
    if sub:
        user = db.get(User, sub.user_id)
    else:
        try:
            user = db.get(User, int(meta.get("user_id", "")))
        except (TypeError, ValueError):
            user = None
    if user is None:
        logger.warning("Webhook event %s: no matching user", event.get("type"))
        return False
    plan = (
        (sub.plan if sub else None) or meta.get("plan") or _plan_for_product(data.get("product_id"))
    )
    if plan not in ("pro", "team"):
        logger.warning("Webhook event %s: unknown plan", event.get("type"))
        return False
    if sub is None:
        sub = Subscription(user_id=user.id, plan=plan, status=status, dodo_subscription_id=sub_id)
        db.add(sub)
    sub.status = status
    customer = data.get("customer")
    if isinstance(customer, dict) and customer.get("customer_id"):
        sub.dodo_customer_id = str(customer["customer_id"])
    period_end = _parse_dt(data.get("next_billing_date")) or _parse_dt(data.get("expires_at"))
    if period_end:
        sub.current_period_end = period_end
    user.plan = plan if status == "active" else "free"
    db.commit()
    return True


def parse_event(body: bytes) -> dict[str, object]:
    """Decode webhook JSON body."""
    try:
        event = json.loads(body)
    except ValueError:
        raise AppError("Invalid payload") from None
    if not isinstance(event, dict):
        raise AppError("Invalid payload")
    return event
