"""AI reply endpoints."""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.limiter import limiter
from app.models import AiReply, User
from app.schemas.reply import ReplyGenerateIn, ReplyOut, ReplyUpdateIn, UsageOut
from app.services import reply_service

router = APIRouter(prefix="/replies", tags=["replies"])

CurrentUser = Annotated[User, Depends(get_current_user)]
Db = Annotated[Session, Depends(get_db)]


@router.get("/usage", response_model=UsageOut)
def get_usage(user: CurrentUser, db: Db) -> UsageOut:
    """Monthly AI reply usage for the current user."""
    used, limit = reply_service.usage(db, user)
    return UsageOut(used=used, limit=limit, plan=user.plan)


@router.post("/generate", response_model=ReplyOut, status_code=201)
@limiter.limit("20/minute")
def generate(
    request: Request,
    body: ReplyGenerateIn,
    user: CurrentUser,
    db: Db,
) -> AiReply:
    """Generate a reply for a message in the chosen tone."""
    return reply_service.create_reply(db, user, body.message, body.tone)


@router.post("/{reply_id}/regenerate", response_model=ReplyOut, status_code=201)
@limiter.limit("20/minute")
def regenerate(
    request: Request,
    reply_id: int,
    user: CurrentUser,
    db: Db,
) -> AiReply:
    """Create a new reply for the same message and tone."""
    old = reply_service.get_reply(db, user, reply_id)
    return reply_service.create_reply(db, user, old.incoming_message, old.tone)


@router.get("", response_model=list[ReplyOut])
def list_replies(
    user: CurrentUser,
    db: Db,
    saved: bool | None = None,
) -> list[AiReply]:
    """List the user's replies, newest first; ?saved=true filters saved ones."""
    stmt = select(AiReply).where(AiReply.user_id == user.id, AiReply.deleted_at.is_(None))
    if saved is not None:
        stmt = stmt.where(AiReply.is_saved == saved)
    return list(db.scalars(stmt.order_by(AiReply.created_at.desc(), AiReply.id.desc())))


@router.put("/{reply_id}", response_model=ReplyOut)
def update_reply(
    reply_id: int,
    body: ReplyUpdateIn,
    user: CurrentUser,
    db: Db,
) -> AiReply:
    """Edit reply text and/or toggle saved."""
    reply = reply_service.get_reply(db, user, reply_id)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(reply, field, value)
    db.commit()
    db.refresh(reply)
    return reply


@router.delete("/{reply_id}", status_code=204)
def delete_reply(reply_id: int, user: CurrentUser, db: Db) -> None:
    """Soft-delete a reply (it still counts toward the monthly free limit)."""
    reply_service.get_reply(db, user, reply_id).deleted_at = datetime.now(timezone.utc)
    db.commit()
