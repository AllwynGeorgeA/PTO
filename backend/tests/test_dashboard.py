"""Dashboard + readiness score."""

from datetime import date, timedelta

import pytest

from app.models import AiReply, HandoverTask, PtoPlan
from app.services.readiness import MESSAGES, compute_score, message_for

URL = "/api/v1/dashboard"


def add_plan(db, user, start_off, end_off, backup="Bob"):
    """Insert a plan relative to today."""
    t = date.today()
    p = PtoPlan(
        user_id=user.id,
        employee_name="A",
        start_date=t + timedelta(start_off),
        end_date=t + timedelta(end_off),
        backup_person=backup,
        contact_email="a@example.com",
    )
    db.add(p)
    db.commit()
    return p


def add_tasks(db, user, plan, done, pending):
    """Insert completed and pending tasks for a plan."""
    for i in range(done + pending):
        db.add(
            HandoverTask(
                user_id=user.id,
                pto_plan_id=plan.id,
                name=f"t{i}",
                status="completed" if i < done else "pending",
            )
        )
    db.commit()


def add_reply(db, user, saved):
    """Insert an AI reply."""
    db.add(
        AiReply(
            user_id=user.id,
            incoming_message="m",
            tone="funny",
            generated_reply="r",
            is_saved=saved,
            source="template",
        )
    )
    db.commit()


@pytest.mark.parametrize("score,idx", [(0, 0), (30, 0), (31, 1), (70, 1), (71, 2), (100, 2)])
def test_message_tiers(score, idx):
    assert message_for(score) == MESSAGES[idx]


def test_compute_score():
    assert compute_score(0, 0, False) == 0
    assert compute_score(0, 0, True) == 30  # no tasks -> only backup counts
    assert compute_score(1, 70, True) == 31
    assert compute_score(1, 1, False) == 70
    assert compute_score(41, 70, True) == 71
    assert compute_score(5, 5, True) == 100


def test_no_plan(client, auth_headers):
    d = client.get(URL, headers=auth_headers).json()
    assert d["next_pto"] is None and d["days_remaining"] is None
    assert d["readiness_score"] == 0 and d["readiness_message"] == MESSAGES[0]


def test_full_dashboard(client, db, user, auth_headers):
    plan = add_plan(db, user, 5, 9)
    add_tasks(db, user, plan, done=1, pending=1)
    add_reply(db, user, True)
    add_reply(db, user, False)
    d = client.get(URL, headers=auth_headers).json()
    assert d["next_pto"]["id"] == plan.id and d["days_remaining"] == 5
    assert d["saved_reply_count"] == 1 and d["pending_task_count"] == 1
    assert d["readiness_score"] == 65 and d["readiness_message"] == MESSAGES[1]  # 35 + 30


def test_no_tasks_with_backup(client, db, user, auth_headers):
    add_plan(db, user, 5, 9)
    assert client.get(URL, headers=auth_headers).json()["readiness_score"] == 30


def test_perfect_score(client, db, user, auth_headers):
    add_tasks(db, user, add_plan(db, user, 5, 9), done=3, pending=0)
    d = client.get(URL, headers=auth_headers).json()
    assert d["readiness_score"] == 100 and d["readiness_message"] == MESSAGES[2]


def test_active_beats_upcoming_and_ignores_completed(client, db, user, auth_headers):
    add_plan(db, user, -10, -5)
    upcoming = add_plan(db, user, 3, 4)
    d = client.get(URL, headers=auth_headers).json()
    assert d["next_pto"]["id"] == upcoming.id
    active = add_plan(db, user, -1, 2)
    d = client.get(URL, headers=auth_headers).json()
    assert d["next_pto"]["id"] == active.id and d["days_remaining"] == 2


def test_isolation(client, db, other_user, auth_headers):
    add_plan(db, other_user, 1, 2)
    assert client.get(URL, headers=auth_headers).json()["next_pto"] is None
