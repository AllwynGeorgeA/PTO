"""Reply business logic: plan limits and persistence."""

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.exceptions import NotFoundError, PlanLimitError
from app.models import AiReply, User
from app.services import ai_service

FREE_MONTHLY_LIMIT = 5


def _month_start() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def usage(db: Session, user: User) -> tuple[int, int | None]:
    """Return (openai replies this UTC month, limit or None if unlimited)."""
    used = db.scalar(
        select(func.count(AiReply.id)).where(
            AiReply.user_id == user.id,
            AiReply.source == "openai",
            # SQLite stores naive datetimes; compare naive UTC so it works on both backends.
            AiReply.created_at >= _month_start().replace(tzinfo=None),
        )
    )
    return used or 0, (FREE_MONTHLY_LIMIT if user.plan == "free" else None)


def create_reply(db: Session, user: User, message: str, tone: str) -> AiReply:
    """Generate and store a reply; enforce the free limit only if OpenAI would be used."""
    if settings.openai_enabled and user.plan == "free":
        # Serialize this user's check-then-insert until commit (no-op on SQLite).
        # NO KEY UPDATE conflicts with itself but not with FK inserts from other tables.
        db.execute(select(User.id).where(User.id == user.id).with_for_update(key_share=True))
    if settings.openai_enabled:
        used, limit = usage(db, user)
        if limit is not None and used >= limit:
            raise PlanLimitError(
                f"Free plan limit of {limit} AI replies per month reached. "
                "Upgrade to Pro for unlimited replies."
            )
    text, source = ai_service.generate_reply(message, tone)
    reply = AiReply(
        user_id=user.id, incoming_message=message, tone=tone, generated_reply=text, source=source
    )
    db.add(reply)
    db.commit()
    db.refresh(reply)
    return reply


def get_reply(db: Session, user: User, reply_id: int) -> AiReply:
    """Fetch a reply owned by the user or raise 404."""
    reply = db.scalar(
        select(AiReply).where(
            AiReply.id == reply_id, AiReply.user_id == user.id, AiReply.deleted_at.is_(None)
        )
    )
    if reply is None:
        raise NotFoundError("Reply not found")
    return reply
