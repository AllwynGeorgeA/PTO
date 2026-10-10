"""AI reply model."""

from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, String, Text, false
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class AiReply(Base, TimestampMixin):
    """Generated reply. Index (user_id, created_at) serves monthly usage counts."""

    __tablename__ = "ai_replies"
    __table_args__ = (
        CheckConstraint(
            "tone IN ('professional','funny','savage_office_safe','corporate_diplomatic')",
            name="ck_ai_replies_tone",
        ),
        CheckConstraint("source IN ('openai','template')", name="ck_ai_replies_source"),
        Index("ix_ai_replies_user_id_created_at", "user_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    incoming_message: Mapped[str] = mapped_column(Text)
    tone: Mapped[str] = mapped_column(String(30))
    generated_reply: Mapped[str] = mapped_column(Text)
    is_saved: Mapped[bool] = mapped_column(Boolean, server_default=false())
    source: Mapped[str] = mapped_column(String(10))
    # Soft delete: deleted rows still count toward the monthly free limit.
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
