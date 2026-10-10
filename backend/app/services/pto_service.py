"""PTO plan CRUD. Every query is scoped by user_id; foreign ids look like 404."""

import logging
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.models import PtoPlan
from app.schemas.pto_plan import PtoPlanIn, compute_status

logger = logging.getLogger(__name__)


def list_plans(db: Session, user_id: int) -> list[PtoPlan]:
    """All of the user's plans, sorted by start_date."""
    stmt = (
        select(PtoPlan).where(PtoPlan.user_id == user_id).order_by(PtoPlan.start_date, PtoPlan.id)
    )
    return list(db.scalars(stmt))


def get_plan(db: Session, user_id: int, plan_id: int) -> PtoPlan:
    """Fetch one plan or raise NotFoundError (also for other users' plans)."""
    plan = db.scalar(select(PtoPlan).where(PtoPlan.id == plan_id, PtoPlan.user_id == user_id))
    if plan is None:
        raise NotFoundError("PTO plan not found")
    return plan


def create_plan(db: Session, user_id: int, data: PtoPlanIn) -> PtoPlan:
    """Create a plan for the user."""
    plan = PtoPlan(user_id=user_id, **data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    logger.info("pto plan %s created for user %s", plan.id, user_id)
    return plan


def update_plan(db: Session, user_id: int, plan_id: int, data: PtoPlanIn) -> PtoPlan:
    """Replace a plan's fields."""
    plan = get_plan(db, user_id, plan_id)
    for key, value in data.model_dump().items():
        setattr(plan, key, value)
    db.commit()
    db.refresh(plan)
    return plan


def delete_plan(db: Session, user_id: int, plan_id: int) -> None:
    """Delete a plan."""
    db.delete(get_plan(db, user_id, plan_id))
    db.commit()


def get_next_plan(db: Session, user_id: int, today: date) -> PtoPlan | None:
    """Active plan if any, else the soonest upcoming plan, else None."""
    upcoming: PtoPlan | None = None
    for plan in list_plans(db, user_id):  # sorted by start_date
        status = compute_status(plan.start_date, plan.end_date, today)
        if status == "active":
            return plan
        if status == "upcoming" and upcoming is None:
            upcoming = plan
    return upcoming
