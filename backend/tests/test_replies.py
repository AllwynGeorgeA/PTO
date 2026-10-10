"""Tests for /api/v1/replies endpoints. OpenAI is mocked via ai_service.complete."""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import settings
from app.main import API_PREFIX, app
from app.models import AiReply, User
from app.routers.replies import router
from app.services import ai_service
from app.services.reply_service import FREE_MONTHLY_LIMIT as LIMIT

BASE = f"{API_PREFIX}/replies"
TONES = ["professional", "funny", "savage_office_safe", "corporate_diplomatic", "tanglish_manager"]


@pytest.fixture(autouse=True)
def _mount_router() -> Iterator[None]:
    """Mount the router if the orchestrator has not registered it yet."""
    if not any(getattr(r, "path", "").startswith(BASE) for r in app.routes):
        app.include_router(router, prefix=API_PREFIX)
    yield


@pytest.fixture
def openai_on(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "sk-test")
    monkeypatch.setattr(ai_service, "complete", lambda *a, **k: "mocked reply")


def _gen(client: TestClient, headers: dict[str, str], message: str = "Need this now") -> object:
    return client.post(
        f"{BASE}/generate", json={"message": message, "tone": "funny"}, headers=headers
    )


def _seed(db: Session, user: User, n: int, source: str = "openai") -> None:
    db.add_all(
        AiReply(
            user_id=user.id, incoming_message="m", tone="funny", generated_reply="r", source=source
        )
        for _ in range(n)
    )
    db.commit()


@pytest.mark.parametrize("tone", TONES)
def test_generate_template_all_tones(client: TestClient, auth_headers: dict, tone: str) -> None:
    r = client.post(
        f"{BASE}/generate", json={"message": "Hello", "tone": tone}, headers=auth_headers
    )
    assert r.status_code == 201
    body = r.json()
    assert body["source"] == "template" and body["tone"] == tone
    assert body["generated_reply"] in ai_service.TEMPLATES[tone]
    assert body["is_saved"] is False


def test_generate_openai(client: TestClient, auth_headers: dict, openai_on: None) -> None:
    r = _gen(client, auth_headers)
    assert r.status_code == 201  # type: ignore[attr-defined]
    assert r.json()["source"] == "openai"  # type: ignore[attr-defined]
    assert r.json()["generated_reply"] == "mocked reply"  # type: ignore[attr-defined]


def test_openai_failure_falls_back_to_template(
    client: TestClient, auth_headers: dict, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "OPENAI_API_KEY", "sk-test")
    monkeypatch.setattr(ai_service, "complete", lambda *a, **k: None)
    r = _gen(client, auth_headers)
    assert r.json()["source"] == "template"  # type: ignore[attr-defined]


def test_free_limit_boundary(
    client: TestClient, auth_headers: dict, openai_on: None, db: Session, user: User
) -> None:
    _seed(db, user, LIMIT - 1)
    assert _gen(client, auth_headers).status_code == 201  # type: ignore[attr-defined]  # last free
    r = _gen(client, auth_headers)
    assert r.status_code == 402  # type: ignore[attr-defined]
    assert "Upgrade" in r.json()["detail"]  # type: ignore[attr-defined]
    usage = client.get(f"{BASE}/usage", headers=auth_headers).json()
    assert usage == {"used": LIMIT, "limit": LIMIT, "plan": "free"}


def test_regenerate_counts_and_is_blocked_over_limit(
    client: TestClient, auth_headers: dict, openai_on: None, db: Session, user: User
) -> None:
    first = _gen(client, auth_headers).json()  # type: ignore[attr-defined]
    _seed(db, user, LIMIT - 2)
    r = client.post(f"{BASE}/{first['id']}/regenerate", headers=auth_headers)
    assert r.status_code == 201
    assert r.json()["id"] != first["id"]
    assert r.json()["incoming_message"] == "Need this now"
    assert client.post(f"{BASE}/{first['id']}/regenerate", headers=auth_headers).status_code == 402


def test_template_replies_not_counted(
    client: TestClient, auth_headers: dict, openai_on: None, db: Session, user: User
) -> None:
    _seed(db, user, 10, source="template")
    assert client.get(f"{BASE}/usage", headers=auth_headers).json()["used"] == 0
    assert _gen(client, auth_headers).status_code == 201  # type: ignore[attr-defined]


def test_no_limit_when_openai_not_configured(
    client: TestClient, auth_headers: dict, db: Session, user: User
) -> None:
    _seed(db, user, 9)  # openai rows exist, but OpenAI is off so template path is free
    assert _gen(client, auth_headers).status_code == 201  # type: ignore[attr-defined]


def test_pro_unlimited(client: TestClient, openai_on: None, db: Session) -> None:
    from tests.conftest import headers_for, make_user

    pro = make_user(db, "pro@example.com", plan="pro")
    _seed(db, pro, 20)
    h = headers_for(pro)
    assert _gen(client, h).status_code == 201  # type: ignore[attr-defined]
    assert client.get(f"{BASE}/usage", headers=h).json() == {
        "used": 21,
        "limit": None,
        "plan": "pro",
    }


def test_edit_save_list_delete(client: TestClient, auth_headers: dict) -> None:
    rid = _gen(client, auth_headers).json()["id"]  # type: ignore[attr-defined]
    r = client.put(
        f"{BASE}/{rid}", json={"generated_reply": "Edited", "is_saved": True}, headers=auth_headers
    )
    assert r.status_code == 200
    assert r.json()["generated_reply"] == "Edited" and r.json()["is_saved"] is True
    _gen(client, auth_headers, "another")
    all_rows = client.get(BASE, headers=auth_headers).json()
    assert len(all_rows) == 2 and all_rows[0]["id"] > all_rows[1]["id"]
    saved = client.get(f"{BASE}?saved=true", headers=auth_headers).json()
    assert [x["id"] for x in saved] == [rid]
    assert client.delete(f"{BASE}/{rid}", headers=auth_headers).status_code == 204
    r = client.put(f"{BASE}/{rid}", json={"is_saved": True}, headers=auth_headers)
    assert r.status_code == 404


def test_user_isolation(client: TestClient, auth_headers: dict, other_headers: dict) -> None:
    rid = _gen(client, auth_headers).json()["id"]  # type: ignore[attr-defined]
    assert client.get(BASE, headers=other_headers).json() == []
    r = client.put(f"{BASE}/{rid}", json={"is_saved": True}, headers=other_headers)
    assert r.status_code == 404
    assert client.delete(f"{BASE}/{rid}", headers=other_headers).status_code == 404
    assert client.post(f"{BASE}/{rid}/regenerate", headers=other_headers).status_code == 404
    assert client.get(BASE, headers=auth_headers).json()[0]["id"] == rid


@pytest.mark.parametrize(
    "payload",
    [
        {"message": "", "tone": "funny"},
        {"message": "x" * 2001, "tone": "funny"},
        {"message": "ok", "tone": "rude"},
    ],
)
def test_validation(client: TestClient, auth_headers: dict, payload: dict) -> None:
    assert client.post(f"{BASE}/generate", json=payload, headers=auth_headers).status_code == 422


def test_requires_auth(client: TestClient) -> None:
    assert client.get(BASE).status_code == 401
    assert client.get(f"{BASE}/usage").status_code == 401


def test_usage_default(client: TestClient, auth_headers: dict) -> None:
    assert client.get(f"{BASE}/usage", headers=auth_headers).json() == {
        "used": 0,
        "limit": LIMIT,
        "plan": "free",
    }


def test_delete_does_not_reset_free_limit(
    client: TestClient, auth_headers: dict, openai_on: None
) -> None:
    ids = [_gen(client, auth_headers).json()["id"] for _ in range(LIMIT)]  # type: ignore[attr-defined]
    for rid in ids:
        assert client.delete(f"{BASE}/{rid}", headers=auth_headers).status_code == 204
    assert client.get(BASE, headers=auth_headers).json() == []
    put = client.put(f"{BASE}/{ids[0]}", json={"is_saved": True}, headers=auth_headers)
    assert put.status_code == 404
    assert client.delete(f"{BASE}/{ids[0]}", headers=auth_headers).status_code == 404
    assert client.get(f"{BASE}/usage", headers=auth_headers).json()["used"] == LIMIT
    assert _gen(client, auth_headers).status_code == 402  # type: ignore[attr-defined]


def test_include_availability_adds_backup_and_return_date(client, auth_headers):
    from datetime import date, timedelta

    start, end = date.today() + timedelta(days=2), date.today() + timedelta(days=9)
    client.post(
        "/api/v1/pto-plans",
        headers=auth_headers,
        json={
            "employee_name": "Alice",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "backup_person": "Sam Lee",
            "contact_email": "sam@example.com",
        },
    )
    r = client.post(
        "/api/v1/replies/generate",
        headers=auth_headers,
        json={"message": "Need this today", "tone": "funny", "include_availability": True},
    )
    assert r.status_code == 201
    text = r.json()["generated_reply"]
    assert "Sam Lee" in text and "sam@example.com" in text
    assert f"{end + timedelta(days=1):%d %b}" in text


def test_availability_ignored_without_plan(client, auth_headers):
    r = client.post(
        "/api/v1/replies/generate",
        headers=auth_headers,
        json={"message": "Hi", "tone": "funny", "include_availability": True},
    )
    assert r.status_code == 201 and "available again" not in r.json()["generated_reply"]
