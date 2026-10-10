"""Idempotent demo data seed.

Usage (from backend\\): .venv\\Scripts\\python.exe -m scripts.seed
Password comes from SEED_DEMO_PASSWORD (default is a demo-only value).
"""

import logging
import os
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AiReply, HandoverTask, PtoPlan, User

logger = logging.getLogger(__name__)

DEMO_EMAIL = "demo@ptoshield.ai"
DEFAULT_DEMO_PASSWORD = "DemoPass123!"  # demo-only, never use in production


def seed(db: Session) -> bool:
    """Create the demo user and sample data. Returns False if already seeded."""
    from app.auth.jwt import hash_password

    if db.scalars(select(User).where(User.email == DEMO_EMAIL)).first():
        logger.info("Demo data already present, skipping")
        return False
    password = os.environ.get("SEED_DEMO_PASSWORD") or DEFAULT_DEMO_PASSWORD
    user = User(
        email=DEMO_EMAIL,
        hashed_password=hash_password(password),
        full_name="Demo User",
        is_active=True,
        is_verified=True,
        plan="free",
    )
    db.add(user)
    db.flush()
    today = date.today()
    upcoming = PtoPlan(
        user_id=user.id,
        employee_name="Demo User",
        start_date=today + timedelta(days=14),
        end_date=today + timedelta(days=21),
        backup_person="Sam Lee",
        contact_email="sam@example.com",
        reason="Beach holiday",
    )
    done = PtoPlan(
        user_id=user.id,
        employee_name="Demo User",
        start_date=today - timedelta(days=60),
        end_date=today - timedelta(days=53),
        backup_person="Sam Lee",
        contact_email="sam@example.com",
        reason="Family visit",
    )
    db.add_all([upcoming, done])
    db.flush()
    tasks = [
        ("Weekly status report", "high", "pending"),
        ("Update client dashboard", "medium", "pending"),
        ("Hand over on-call rota", "high", "completed"),
        ("Archive old tickets", "low", "pending"),
        ("Share vendor contacts", "medium", "completed"),
        ("Refresh team wiki", "low", "pending"),
    ]
    for name, priority, status in tasks:
        db.add(
            HandoverTask(
                user_id=user.id,
                pto_plan_id=upcoming.id,
                name=name,
                priority=priority,
                status=status,
                backup_person="Sam Lee",
                deadline=today + timedelta(days=10),
            )
        )
    replies = [
        (
            "Can you join a call tomorrow?",
            "professional",
            "Thanks for reaching out. I'm on leave right now; Sam Lee can help.",
        ),
        (
            "Quick question on the report",
            "funny",
            "I'm out sipping something cold. Sam Lee has the report covered!",
        ),
        (
            "Need this urgently",
            "corporate_diplomatic",
            "I appreciate the urgency. While I'm away, Sam Lee will prioritise this for you.",
        ),
        (
            "Are you free this week?",
            "savage_office_safe",
            "My calendar says beach. Sam Lee is your best bet.",
        ),
    ]
    for msg, tone, reply in replies:
        db.add(
            AiReply(
                user_id=user.id,
                incoming_message=msg,
                tone=tone,
                generated_reply=reply,
                is_saved=True,
                source="template",
            )
        )
    db.commit()
    logger.info("Seeded demo user %s", DEMO_EMAIL)
    return True


if __name__ == "__main__":
    from app.database import SessionLocal

    logging.basicConfig(level=logging.INFO)
    with SessionLocal() as session:
        seed(session)
