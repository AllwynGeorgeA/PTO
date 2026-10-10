"""Handover assistant tests (own app mounting only this router, so it is independent of main.py)."""

from collections.abc import Iterator
from datetime import date, timedelta

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.database import get_db
from app.exceptions import register_exception_handlers
from app.models import PtoPlan, User
from app.routers.handover import router
from app.services import handover_service

URL = "/api/v1/handover-tasks"


@pytest.fixture
def hc(db_engine: Engine) -> Iterator[TestClient]:
    """Client for an app with only the handover router."""
    factory = sessionmaker(bind=db_engine, expire_on_commit=False)

    def override() -> Iterator[Session]:
        with factory() as s:
            yield s

    app = FastAPI()
    register_exception_handlers(app)
    app.include_router(router, prefix="/api/v1")
    app.dependency_overrides[get_db] = override
    with TestClient(app) as c:
        yield c


def make_plan(db: Session, user: User) -> PtoPlan:
    plan = PtoPlan(
        user_id=user.id,
        employee_name="A",
        start_date=date.today(),
        end_date=date.today() + timedelta(days=5),
        backup_person="Bob",
        contact_email="a@example.com",
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def mk(c: TestClient, h: dict[str, str], **kw: object) -> dict:
    body = {"name": "Task", **kw}
    r = c.post(URL, json=body, headers=h)
    assert r.status_code == 201, r.text
    return r.json()


def test_requires_auth(hc: TestClient) -> None:
    assert hc.get(URL).status_code == 401


def test_crud(hc: TestClient, auth_headers: dict[str, str]) -> None:
    t = mk(hc, auth_headers, description="d", priority="high", backup_person="Bob")
    assert t["status"] == "pending" and t["priority"] == "high" and t["pto_plan_id"] is None
    assert mk(hc, auth_headers)["priority"] == "medium"
    r = hc.put(f"{URL}/{t['id']}", json={"name": "New", "priority": "low"}, headers=auth_headers)
    assert r.status_code == 200 and r.json()["name"] == "New" and r.json()["priority"] == "low"
    assert len(hc.get(URL, headers=auth_headers).json()) == 2
    assert hc.delete(f"{URL}/{t['id']}", headers=auth_headers).status_code == 204
    assert len(hc.get(URL, headers=auth_headers).json()) == 1
    assert hc.put(f"{URL}/{t['id']}", json={"name": "x"}, headers=auth_headers).status_code == 404


@pytest.mark.parametrize(
    "body",
    [{"name": ""}, {"name": "x" * 201}, {"name": "x", "priority": "urgent"}, {}],
)
def test_validation(hc: TestClient, auth_headers: dict[str, str], body: dict) -> None:
    assert hc.post(URL, json=body, headers=auth_headers).status_code == 422


def test_toggle_both_ways(hc: TestClient, auth_headers: dict[str, str]) -> None:
    t = mk(hc, auth_headers)
    r = hc.post(f"{URL}/{t['id']}/toggle", headers=auth_headers)
    assert r.json()["status"] == "completed"
    r = hc.post(f"{URL}/{t['id']}/toggle", headers=auth_headers)
    assert r.json()["status"] == "pending"


def test_filters(hc: TestClient, db: Session, user: User, auth_headers: dict[str, str]) -> None:
    plan = make_plan(db, user)
    a = mk(hc, auth_headers, name="A", pto_plan_id=plan.id)
    mk(hc, auth_headers, name="B")
    hc.post(f"{URL}/{a['id']}/toggle", headers=auth_headers)
    done = hc.get(URL, params={"status": "completed"}, headers=auth_headers).json()
    assert [x["name"] for x in done] == ["A"]
    pend = hc.get(URL, params={"status": "pending"}, headers=auth_headers).json()
    assert [x["name"] for x in pend] == ["B"]
    by_plan = hc.get(URL, params={"pto_plan_id": plan.id}, headers=auth_headers).json()
    assert [x["name"] for x in by_plan] == ["A"]
    assert hc.get(URL, params={"status": "bogus"}, headers=auth_headers).status_code == 422


def test_summary_template(hc: TestClient, auth_headers: dict[str, str]) -> None:
    past = (date.today() - timedelta(days=2)).isoformat()
    mk(hc, auth_headers, name="Low done", priority="low")
    mk(hc, auth_headers, name="Late one", priority="high", backup_person="Bob", deadline=past)
    mk(hc, auth_headers, name="Mid", priority="medium")
    done = mk(hc, auth_headers, name="Finished", priority="high")
    hc.post(f"{URL}/{done['id']}/toggle", headers=auth_headers)
    r = hc.post(f"{URL}/summary", json={}, headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["source"] == "template"
    s = body["summary"]
    assert "3 pending, 1 completed, 1 overdue" in s
    assert "owner: Bob" in s and "(OVERDUE)" in s
    assert s.index("Late one") < s.index("Mid") < s.index("Finished")  # pending first, by priority


def test_summary_empty(hc: TestClient, auth_headers: dict[str, str]) -> None:
    r = hc.post(f"{URL}/summary", json={}, headers=auth_headers)
    assert r.status_code == 200 and r.json()["source"] == "template"


def _go_pro(db: Session, user: User) -> None:
    user.plan = "pro"
    db.commit()


def test_summary_free_plan_never_calls_ai(
    hc: TestClient, auth_headers: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    mk(hc, auth_headers)

    def boom(*a: object, **k: object) -> str:
        raise AssertionError("AI must not be called for free plan")

    monkeypatch.setattr(handover_service.ai_service, "complete", boom, raising=False)
    assert hc.post(f"{URL}/summary", json={}, headers=auth_headers).json()["source"] == "template"


def test_summary_caps_tasks_dropping_completed_first(
    hc: TestClient, auth_headers: dict[str, str]
) -> None:
    done = mk(hc, auth_headers, name="OldDone")
    hc.post(f"{URL}/{done['id']}/toggle", headers=auth_headers)
    for i in range(50):
        mk(hc, auth_headers, name=f"P{i}")
    s = hc.post(f"{URL}/summary", json={}, headers=auth_headers).json()["summary"]
    assert "OldDone" not in s and "50 pending, 0 completed" in s


def test_input_length_caps(hc: TestClient, auth_headers: dict[str, str]) -> None:
    for field, n in (("description", 2001), ("name", 201), ("backup_person", 101)):
        r = hc.post(URL, json={"name": "x", field: "a" * n}, headers=auth_headers)
        assert r.status_code == 422, field


def test_summary_ai(
    hc: TestClient,
    db: Session,
    user: User,
    auth_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _go_pro(db, user)
    mk(hc, auth_headers, name="Report")
    seen: list[str] = []

    def fake(system: str, prompt: str, max_tokens: int = 300) -> str:
        seen.append(prompt)
        return "  Hi team, here is the handover.  "

    monkeypatch.setattr(handover_service.ai_service, "complete", fake, raising=False)
    body = hc.post(f"{URL}/summary", json={}, headers=auth_headers).json()
    assert body == {"summary": "Hi team, here is the handover.", "source": "openai"}
    assert "Report" in seen[0]


@pytest.mark.parametrize("result", [None, "   "])
def test_summary_ai_unavailable_falls_back(
    hc: TestClient,
    db: Session,
    user: User,
    auth_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
    result: str | None,
) -> None:
    _go_pro(db, user)
    mk(hc, auth_headers)
    monkeypatch.setattr(
        handover_service.ai_service, "complete", lambda *a, **k: result, raising=False
    )
    assert hc.post(f"{URL}/summary", json={}, headers=auth_headers).json()["source"] == "template"


def test_summary_ai_exception_falls_back(
    hc: TestClient,
    db: Session,
    user: User,
    auth_headers: dict[str, str],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _go_pro(db, user)
    mk(hc, auth_headers)

    def boom(*a: object, **k: object) -> str:
        raise RuntimeError("down")

    monkeypatch.setattr(handover_service.ai_service, "complete", boom, raising=False)
    assert hc.post(f"{URL}/summary", json={}, headers=auth_headers).json()["source"] == "template"


def test_summary_scoped_to_plan(
    hc: TestClient, db: Session, user: User, auth_headers: dict[str, str]
) -> None:
    plan = make_plan(db, user)
    mk(hc, auth_headers, name="InPlan", pto_plan_id=plan.id)
    mk(hc, auth_headers, name="Outside")
    s = hc.post(f"{URL}/summary", json={"pto_plan_id": plan.id}, headers=auth_headers).json()
    assert "InPlan" in s["summary"] and "Outside" not in s["summary"]


def test_isolation(
    hc: TestClient,
    db: Session,
    user: User,
    other_user: User,
    auth_headers: dict[str, str],
    other_headers: dict[str, str],
) -> None:
    mine = mk(hc, auth_headers, name="Mine")
    tid = mine["id"]
    assert hc.get(URL, headers=other_headers).json() == []
    assert hc.put(f"{URL}/{tid}", json={"name": "x"}, headers=other_headers).status_code == 404
    assert hc.post(f"{URL}/{tid}/toggle", headers=other_headers).status_code == 404
    assert hc.delete(f"{URL}/{tid}", headers=other_headers).status_code == 404
    # untouched
    assert hc.get(URL, headers=auth_headers).json()[0]["status"] == "pending"

    plan = make_plan(db, user)
    r = hc.post(URL, json={"name": "x", "pto_plan_id": plan.id}, headers=other_headers)
    assert r.status_code == 404
    own = mk(hc, other_headers, name="Theirs")
    body = {"name": "x", "pto_plan_id": plan.id}
    r = hc.put(f"{URL}/{own['id']}", json=body, headers=other_headers)
    assert r.status_code == 404
    r = hc.post(f"{URL}/summary", json={"pto_plan_id": plan.id}, headers=other_headers)
    assert r.status_code == 404
    assert hc.get(URL, params={"pto_plan_id": plan.id}, headers=other_headers).json() == []
