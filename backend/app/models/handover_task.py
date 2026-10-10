"""Handover task model."""

from datetime import date

from sqlalchemy import CheckConstraint, Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class HandoverTask(Base, TimestampMixin):
    """A task to hand over, optionally tied to a PTO plan."""

    __tablename__ = "handover_tasks"
    __table_args__ = (
        CheckConstraint("priority IN ('low','medium','high')", name="ck_handover_tasks_priority"),
        CheckConstraint("status IN ('pending','completed')", name="ck_handover_tasks_status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    pto_plan_id: Mapped[int | None] = mapped_column(
        ForeignKey("pto_plans.id", ondelete="SET NULL"), index=True
    )
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    priority: Mapped[str] = mapped_column(String(10), server_default="medium")
    backup_person: Mapped[str | None] = mapped_column(String(100))
    deadline: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(10), server_default="pending")
