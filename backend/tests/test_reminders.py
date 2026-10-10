"""Reminder service tests."""

from datetime import date, timedelta

import pytest
from sqlalchemy.orm import Session

from app.config import settings
from app.models import PtoPlan, User
from app.services import reminder_service

TODAY = date(2030, 6, 1)


def _plan(db: Session, user: User, start: date, sent: bool = False) -> PtoPlan:
    from datetime import datetime, timezone

    p = PtoPlan(
        user_id=user.id,
        employee_name="E",
        start_date=start,
        end_date=start + timedelta(days=3),
        backup_person="B",
        contact_email="b@x.com",
        reminder_sent_at=datetime.now(timezone.utc) if sent else None,
    )
    db.add(p)
    db.commit()
    return p


def test_log_only_without_smtp(db: Session, user: User) -> None:
    p = _plan(db, user, TODAY + timedelta(days=1))
    assert reminder_service.send_due_reminders(db, TODAY) == 0
    db.refresh(p)
    assert p.reminder_sent_at is None


def test_sends_only_due_plans(
    db: Session, user: User, other_user: User, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.test")
    sent: list[str] = []
    monkeypatch.setattr(reminder_service, "send_email", lambda to, s, b: sent.append(to))
    due = _plan(db, user, TODAY + timedelta(days=1))
    _plan(db, user, TODAY + timedelta(days=2))
    _plan(db, user, TODAY + timedelta(days=1), sent=True)
    other_user.is_active = False
    db.commit()
    _plan(db, other_user, TODAY + timedelta(days=1))
    assert reminder_service.send_due_reminders(db, TODAY) == 1
    assert sent == [user.email]
    db.refresh(due)
    assert due.reminder_sent_at is not None
    assert reminder_service.send_due_reminders(db, TODAY) == 0


def test_failed_send_leaves_unsent(
    db: Session, user: User, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.test")

    def boom(*a: str) -> None:
        raise OSError("down")

    monkeypatch.setattr(reminder_service, "send_email", boom)
    p = _plan(db, user, TODAY + timedelta(days=1))
    assert reminder_service.send_due_reminders(db, TODAY) == 0
    db.refresh(p)
    assert p.reminder_sent_at is None


def test_smtp_called_with_starttls(
    db: Session, user: User, monkeypatch: pytest.MonkeyPatch
) -> None:
    calls: list[str] = []

    class FakeSMTP:
        def __init__(self, *a: object, **k: object) -> None:
            calls.append("init")

        def __enter__(self) -> "FakeSMTP":
            return self

        def __exit__(self, *a: object) -> None:
            return None

        def starttls(self) -> None:
            calls.append("starttls")

        def login(self, u: str, p: str) -> None:
            calls.append("login")

        def send_message(self, m: object) -> None:
            calls.append("send")

    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.test")
    monkeypatch.setattr(settings, "SMTP_USER", "u")
    monkeypatch.setattr(reminder_service.smtplib, "SMTP", FakeSMTP)
    p = _plan(db, user, TODAY + timedelta(days=1))
    assert reminder_service.send_due_reminders(db, TODAY) == 1
    assert calls == ["init", "starttls", "login", "send"]
    db.refresh(p)
    assert p.reminder_sent_at is not None
