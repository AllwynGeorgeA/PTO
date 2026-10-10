"""Seed script tests."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import AiReply, HandoverTask, PtoPlan, User
from scripts.seed import DEMO_EMAIL, seed


def test_seed_is_idempotent(db: Session) -> None:
    assert seed(db) is True
    assert seed(db) is False
    assert db.scalar(select(func.count()).select_from(User)) == 1
    assert db.scalar(select(func.count()).select_from(PtoPlan)) == 2
    assert db.scalar(select(func.count()).select_from(HandoverTask)) == 6
    assert db.scalar(select(func.count()).select_from(AiReply)) == 4
    demo = db.scalars(select(User).where(User.email == DEMO_EMAIL)).one()
    assert demo.hashed_password and demo.is_admin is False
