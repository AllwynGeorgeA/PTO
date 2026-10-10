"""Readiness score: 70% handover completion + 30% backup person set."""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import HandoverTask
from app.services.pto_service import get_next_plan

MESSAGES = (
    "Your vacation is in danger. Your inbox owns you. 😂",
    "Almost free! Your manager is still emotionally processing it.",
    "Congratulations! You're officially unavailable to capitalism. 🏝️",
)


def compute_score(completed: int, total: int, has_backup: bool) -> int:
    """Pure score calculation, rounded to an int in 0-100."""
    handover = 70 * completed / total if total else 0
    return round(handover + (30 if has_backup else 0))


def message_for(score: int) -> str:
    """Tiered message: 0-30, 31-70, 71-100."""
    return MESSAGES[0] if score <= 30 else MESSAGES[1] if score <= 70 else MESSAGES[2]


def readiness(db: Session, user_id: int, today: date) -> tuple[int, str]:
    """Score and message for the user's next-or-active plan (0 if no plan)."""
    plan = get_next_plan(db, user_id, today)
    if plan is None:
        return 0, MESSAGES[0]
    total = db.scalar(
        select(func.count(HandoverTask.id)).where(
            HandoverTask.user_id == user_id, HandoverTask.pto_plan_id == plan.id
        )
    )
    completed = db.scalar(
        select(func.count(HandoverTask.id)).where(
            HandoverTask.user_id == user_id,
            HandoverTask.pto_plan_id == plan.id,
            HandoverTask.status == "completed",
        )
    )
    score = compute_score(completed or 0, total or 0, bool(plan.backup_person.strip()))
    return score, message_for(score)
