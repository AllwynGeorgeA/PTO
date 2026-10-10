"""Handover task endpoints."""

from typing import Literal

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.limiter import limiter
from app.models import HandoverTask, User
from app.schemas.handover import HandoverTaskIn, HandoverTaskOut, SummaryIn, SummaryOut
from app.services import handover_service as svc

router = APIRouter(prefix="/handover-tasks", tags=["handover"])


@router.get("", response_model=list[HandoverTaskOut])
def list_tasks(
    status: Literal["pending", "completed"] | None = None,
    pto_plan_id: int | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[HandoverTask]:
    """List my tasks (filters: status, pto_plan_id)."""
    return svc.list_tasks(db, user.id, status, pto_plan_id)


@router.post("", response_model=HandoverTaskOut, status_code=201)
def create_task(
    data: HandoverTaskIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> HandoverTask:
    """Create a task."""
    return svc.create_task(db, user.id, data)


# Must stay above the /{task_id} routes so "summary" is never parsed as an id.
@router.post("/summary", response_model=SummaryOut)
@limiter.limit("10/minute")
def summary(
    request: Request,
    data: SummaryIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SummaryOut:
    """Generate a copyable handover summary (AI or template)."""
    text, source = svc.generate_summary(db, user, data.pto_plan_id)
    return SummaryOut(summary=text, source=source)


@router.put("/{task_id}", response_model=HandoverTaskOut)
def update_task(
    task_id: int,
    data: HandoverTaskIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HandoverTask:
    """Update a task."""
    return svc.update_task(db, user.id, task_id, data)


@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Response:
    """Delete a task."""
    svc.delete_task(db, user.id, task_id)
    return Response(status_code=204)


@router.post("/{task_id}/toggle", response_model=HandoverTaskOut)
def toggle_task(
    task_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> HandoverTask:
    """Complete or reopen a task."""
    return svc.toggle_task(db, user.id, task_id)
