"""Billing routes (Dodo Payments, demo mode when no API key)."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, Request
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_current_user, get_db
from app.exceptions import UnauthorizedError
from app.limiter import limiter
from app.models import User
from app.schemas.billing import (
    CheckoutRequest,
    CheckoutResponse,
    PlanOut,
    PlansResponse,
    SubscriptionOut,
)
from app.services import billing_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/plans", response_model=PlansResponse)
def list_plans() -> PlansResponse:
    """Public plan list."""
    return PlansResponse(
        plans=[PlanOut(**p) for p in billing_service.PLANS],  # type: ignore[arg-type]
        demo=settings.dodo_demo_mode,
    )


@router.post("/checkout", response_model=CheckoutResponse)
@limiter.limit("30/minute")
async def checkout(
    request: Request, body: CheckoutRequest, user: User = Depends(get_current_user)
) -> CheckoutResponse:
    """Start checkout. Demo mode changes nothing and charges nothing."""
    if settings.dodo_demo_mode:
        return CheckoutResponse(
            demo=True, checkout_url=None, message="Demo mode: no real payment was made"
        )
    url = await billing_service.create_checkout(user, body.plan)
    return CheckoutResponse(checkout_url=url, demo=False)


@router.post("/webhook")
async def webhook(request: Request, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Signature-verified Dodo webhook."""
    if settings.dodo_demo_mode:
        logger.warning("Webhook ignored: demo mode never changes plans")
        return {"received": True, "handled": False}
    body = await request.body()
    if not billing_service.verify_signature(dict(request.headers), body):
        logger.warning("Rejected webhook: bad or missing signature")
        raise UnauthorizedError("Invalid webhook signature")
    # ponytail: known limitations - subscription.cancelled downgrades to free immediately
    # (not at period end) and events are applied in arrival order (no ordering/replay guard).
    event = billing_service.parse_event(body)
    handled = await run_in_threadpool(billing_service.handle_event, db, event)
    return {"received": True, "handled": handled}


@router.get("/subscription", response_model=SubscriptionOut)
def my_subscription(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> SubscriptionOut:
    """Current plan and subscription status."""
    sub = billing_service.get_subscription(db, user.id)
    return SubscriptionOut(
        plan=user.plan,
        status=sub.status if sub else "none",
        current_period_end=sub.current_period_end if sub else None,
        demo=settings.dodo_demo_mode,
    )
