"""Handover task CRUD, toggle and summary generation. All queries are scoped by user_id."""

import logging
from datetime import date
from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.exceptions import NotFoundError
from app.models import HandoverTask, PtoPlan, User
from app.schemas.handover import HandoverTaskIn
from app.services import ai_service

logger = logging.getLogger(__name__)

_PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}

MAX_SUMMARY_TASKS = 50

_SYSTEM = (
    "You write friendly, professional handover notes for someone going on leave. "
    "Use only the facts given. Plain text, no invented details. Mention overdue items clearly."
)


def _check_plan(db: Session, user_id: int, plan_id: int | None) -> None:
    """Raise 404 unless plan_id is None or belongs to the user."""
    if plan_id is None:
        return
    found = db.scalar(select(PtoPlan.id).where(PtoPlan.id == plan_id, PtoPlan.user_id == user_id))
    if found is None:
        raise NotFoundError("PTO plan not found")


def list_tasks(
    db: Session, user_id: int, status: str | None = None, pto_plan_id: int | None = None
) -> list[HandoverTask]:
    """List the user's tasks, newest first, with optional filters."""
    stmt = select(HandoverTask).where(HandoverTask.user_id == user_id)
    if status:
        stmt = stmt.where(HandoverTask.status == status)
    if pto_plan_id is not None:
        stmt = stmt.where(HandoverTask.pto_plan_id == pto_plan_id)
    return list(db.scalars(stmt.order_by(HandoverTask.id.desc())))


def get_task(db: Session, user_id: int, task_id: int) -> HandoverTask:
    """Fetch one of the user's tasks or raise 404."""
    task = db.scalar(
        select(HandoverTask).where(HandoverTask.id == task_id, HandoverTask.user_id == user_id)
    )
    if task is None:
        raise NotFoundError("Task not found")
    return task


def create_task(db: Session, user_id: int, data: HandoverTaskIn) -> HandoverTask:
    """Create a task."""
    _check_plan(db, user_id, data.pto_plan_id)
    task = HandoverTask(user_id=user_id, **data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task(db: Session, user_id: int, task_id: int, data: HandoverTaskIn) -> HandoverTask:
    """Replace a task's editable fields."""
    task = get_task(db, user_id, task_id)
    _check_plan(db, user_id, data.pto_plan_id)
    for key, value in data.model_dump().items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, user_id: int, task_id: int) -> None:
    """Delete a task."""
    db.delete(get_task(db, user_id, task_id))
    db.commit()


def toggle_task(db: Session, user_id: int, task_id: int) -> HandoverTask:
    """Flip pending <-> completed."""
    task = get_task(db, user_id, task_id)
    task.status = "pending" if task.status == "completed" else "completed"
    db.commit()
    db.refresh(task)
    return task


def _line(task: HandoverTask, today: date) -> str:
    """One bullet line for a task."""
    parts = [f"- [{task.priority.upper()}] {task.name}"]
    if task.backup_person:
        parts.append(f"owner: {task.backup_person}")
    if task.deadline:
        due = f"due {task.deadline.isoformat()}"
        if task.status == "pending" and task.deadline < today:
            due += " (OVERDUE)"
        parts.append(due)
    text = " | ".join(parts)
    return f"{text}\n  {task.description}" if task.description else text


def build_template(tasks: list[HandoverTask], today: date) -> str:
    """Deterministic plain-text summary: pending first, high priority first."""
    if not tasks:
        return "Handover summary\n\nNo handover tasks yet."

    def key(t: HandoverTask) -> tuple[int, date]:
        return (_PRIORITY_ORDER[t.priority], t.deadline or date.max)

    pending = sorted((t for t in tasks if t.status == "pending"), key=key)
    done = sorted((t for t in tasks if t.status == "completed"), key=key)
    overdue = sum(1 for t in pending if t.deadline and t.deadline < today)
    head = f"Handover summary\n\n{len(pending)} pending, {len(done)} completed"
    if overdue:
        head += f", {overdue} overdue"
    out = [head]
    if pending:
        out.append("Pending\n" + "\n".join(_line(t, today) for t in pending))
    if done:
        out.append("Completed\n" + "\n".join(_line(t, today) for t in done))
    return "\n\n".join(out)


def generate_summary(
    db: Session, user: User, pto_plan_id: int | None
) -> tuple[str, Literal["openai", "template"]]:
    """Return (summary, source). AI only for Pro/Team; free plan gets the template."""
    _check_plan(db, user.id, pto_plan_id)
    tasks = list_tasks(db, user.id, pto_plan_id=pto_plan_id)  # newest first
    if len(tasks) > MAX_SUMMARY_TASKS:
        # Drop oldest completed first, then oldest pending if still too many.
        keep_pending = [t for t in tasks if t.status == "pending"][:MAX_SUMMARY_TASKS]
        room = MAX_SUMMARY_TASKS - len(keep_pending)
        keep_done = [t for t in tasks if t.status == "completed"][:room]
        tasks = sorted(keep_pending + keep_done, key=lambda t: -t.id)
    template = build_template(tasks, date.today())
    if not tasks or user.plan == "free":
        return template, "template"
    try:
        text = ai_service.complete(
            _SYSTEM, "Rewrite this as a friendly handover note:\n\n" + template, max_tokens=500
        )
    except Exception:  # AI must never break the endpoint
        logger.exception("AI summary failed; using template")
        text = None
    if text and text.strip():
        return text.strip(), "openai"
    return template, "template"
