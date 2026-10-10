"""Subscription model (Dodo Payments)."""

from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Subscription(Base, TimestampMixin):
    """Billing subscription for a user."""

    __tablename__ = "subscriptions"
    __table_args__ = (
        CheckConstraint("plan IN ('free','pro','team')", name="ck_subscriptions_plan"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    plan: Mapped[str] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(30))
    dodo_customer_id: Mapped[str | None] = mapped_column(String(100))
    dodo_subscription_id: Mapped[str | None] = mapped_column(String(100), index=True)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
