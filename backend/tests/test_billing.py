"""Billing tests: demo checkout, plans, webhook signature and idempotency.

Uses a local app with only the billing router so tests do not depend on main.py wiring.
"""

import base64
import hashlib
import hmac
import json
import time
from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.dependencies import get_current_user, get_db
from app.exceptions import register_exception_handlers
from app.models import Subscription, User
from app.routers.billing import router

SECRET_RAW = b"supersecretkey"
SECRET = "whsec_" + base64.b64encode(SECRET_RAW).decode()


@pytest.fixture
def bclient(db_engine: Engine, user: User) -> Iterator[TestClient]:
    app = FastAPI()
    register_exception_handlers(app)
    app.include_router(router)
    factory = sessionmaker(bind=db_engine, expire_on_commit=False)

    def _db() -> Iterator[Session]:
        with factory() as s:
            yield s

    async def _user() -> User:
        with factory() as s:
            return s.get(User, user.id)  # type: ignore[return-value]

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user] = _user
    with TestClient(app) as c:
        yield c


def _signed(
    body: dict[str, object], msg_id: str = "msg_1", ts: int | None = None, key: bytes = SECRET_RAW
) -> tuple[bytes, dict[str, str]]:
    raw = json.dumps(body).encode()
    ts_s = str(ts if ts is not None else int(time.time()))
    signed = f"{msg_id}.{ts_s}.".encode() + raw
    sig = base64.b64encode(hmac.new(key, signed, hashlib.sha256).digest())
    return raw, {
        "webhook-id": msg_id,
        "webhook-timestamp": ts_s,
        "webhook-signature": f"v1,{sig.decode()}",
        "content-type": "application/json",
    }


def _event(user_id: int, etype: str = "subscription.active") -> dict[str, object]:
    return {
        "type": etype,
        "data": {
            "subscription_id": "sub_1",
            "customer": {"customer_id": "cus_1"},
            "next_billing_date": "2030-01-01T00:00:00Z",
            "metadata": {"user_id": str(user_id), "plan": "pro"},
        },
    }


def test_plans(bclient: TestClient) -> None:
    data = bclient.get("/billing/plans").json()
    assert [p["id"] for p in data["plans"]] == ["free", "pro", "team"]
    assert data["plans"][1]["price"] == 4.99
    assert data["demo"] is True


def test_demo_checkout_changes_nothing(bclient: TestClient, db: Session, user: User) -> None:
    r = bclient.post("/billing/checkout", json={"plan": "pro"})
    assert r.status_code == 200
    assert r.json() == {
        "checkout_url": None,
        "demo": True,
        "message": "Demo mode: no real payment was made",
    }
    db.expire_all()
    assert db.get(User, user.id).plan == "free"  # type: ignore[union-attr]
    assert db.query(Subscription).count() == 0
    assert bclient.get("/billing/subscription").json()["status"] == "none"


def test_webhook_rejects_without_secret(
    bclient: TestClient, user: User, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "DODO_API_KEY", "k")
    raw, headers = _signed(_event(user.id))
    assert bclient.post("/billing/webhook", content=raw, headers=headers).status_code == 401


def test_webhook_rejects_bad_missing_stale(
    bclient: TestClient, db: Session, user: User, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "DODO_API_KEY", "k")
    monkeypatch.setattr(settings, "DODO_WEBHOOK_SECRET", SECRET)
    raw, headers = _signed(_event(user.id), key=b"wrong")
    assert bclient.post("/billing/webhook", content=raw, headers=headers).status_code == 401
    assert bclient.post("/billing/webhook", content=raw).status_code == 401
    raw, headers = _signed(_event(user.id), ts=int(time.time()) - 3600)
    assert bclient.post("/billing/webhook", content=raw, headers=headers).status_code == 401
    db.expire_all()
    assert db.get(User, user.id).plan == "free"  # type: ignore[union-attr]


def test_webhook_updates_plan_and_is_idempotent(
    bclient: TestClient, db: Session, user: User, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "DODO_API_KEY", "k")
    monkeypatch.setattr(settings, "DODO_WEBHOOK_SECRET", SECRET)
    raw, headers = _signed(_event(user.id))
    for _ in range(2):
        assert bclient.post("/billing/webhook", content=raw, headers=headers).status_code == 200
    db.expire_all()
    assert db.get(User, user.id).plan == "pro"  # type: ignore[union-attr]
    assert db.query(Subscription).count() == 1
    sub = bclient.get("/billing/subscription").json()
    assert sub["plan"] == "pro" and sub["status"] == "active"

    raw, headers = _signed(_event(user.id, "subscription.cancelled"), msg_id="msg_2")
    assert bclient.post("/billing/webhook", content=raw, headers=headers).status_code == 200
    db.expire_all()
    assert db.get(User, user.id).plan == "free"  # type: ignore[union-attr]
    assert db.query(Subscription).one().status == "cancelled"


def test_webhook_ignored_in_demo_mode(
    bclient: TestClient, db: Session, user: User, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "DODO_API_KEY", "")  # demo mode
    monkeypatch.setattr(settings, "DODO_WEBHOOK_SECRET", SECRET)
    raw, headers = _signed(_event(user.id))
    r = bclient.post("/billing/webhook", content=raw, headers=headers)
    assert r.status_code == 200 and r.json()["handled"] is False
    db.expire_all()
    assert db.get(User, user.id).plan == "free"  # type: ignore[union-attr]
    assert db.query(Subscription).count() == 0
