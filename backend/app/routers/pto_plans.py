"""PTO plan endpoints."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import PtoPlan, User
from app.schemas.pto_plan import PtoPlanIn, PtoPlanOut
from app.services import pto_service

router = APIRouter(prefix="/pto-plans", tags=["pto-plans"])


@router.get("", response_model=list[PtoPlanOut])
def list_plans(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[PtoPlan]:
    """List the user's plans by start date."""
    return pto_service.list_plans(db, user.id)


@router.post("", response_model=PtoPlanOut, status_code=201)
def create_plan(
    data: PtoPlanIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> PtoPlan:
    """Create a plan."""
    return pto_service.create_plan(db, user.id, data)


@router.get("/{plan_id}", response_model=PtoPlanOut)
def get_plan(
    plan_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> PtoPlan:
    """Get one plan."""
    return pto_service.get_plan(db, user.id, plan_id)


@router.put("/{plan_id}", response_model=PtoPlanOut)
def update_plan(
    plan_id: int,
    data: PtoPlanIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PtoPlan:
    """Update a plan."""
    return pto_service.update_plan(db, user.id, plan_id, data)


@router.delete("/{plan_id}", status_code=204)
def delete_plan(
    plan_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Response:
    """Delete a plan."""
    pto_service.delete_plan(db, user.id, plan_id)
    return Response(status_code=204)
