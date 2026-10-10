"""Dashboard summary endpoint."""

from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import AiReply, HandoverTask, User
from app.schemas.pto_plan import PtoPlanOut, compute_days_remaining
from app.services import pto_service, readiness

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardOut(BaseModel):
    """Dashboard payload."""

    next_pto: PtoPlanOut | None
    days_remaining: int | None
    saved_reply_count: int
    pending_task_count: int
    readiness_score: int
    readiness_message: str


@router.get("", response_model=DashboardOut)
def get_dashboard(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> DashboardOut:
    """Summary of next PTO, counts and readiness score."""
    today = date.today()
    plan = pto_service.get_next_plan(db, user.id, today)
    saved = db.scalar(
        select(func.count(AiReply.id)).where(
            AiReply.user_id == user.id,
            AiReply.is_saved.is_(True),
            AiReply.deleted_at.is_(None),
        )
    )
    pending = db.scalar(
        select(func.count(HandoverTask.id)).where(
            HandoverTask.user_id == user.id, HandoverTask.status == "pending"
        )
    )
    score, message = readiness.readiness(db, user.id, today)
    return DashboardOut(
        next_pto=PtoPlanOut.model_validate(plan) if plan else None,
        days_remaining=compute_days_remaining(plan.start_date, plan.end_date, today)
        if plan
        else None,
        saved_reply_count=saved or 0,
        pending_task_count=pending or 0,
        readiness_score=score,
        readiness_message=message,
    )
