"""User model."""

from sqlalchemy import Boolean, CheckConstraint, String, false, true
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    """Application user. hashed_password is NULL for OAuth-only accounts."""

    __tablename__ = "users"
    __table_args__ = (CheckConstraint("plan IN ('free','pro','team')", name="ck_users_plan"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255))
    full_name: Mapped[str | None] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=true())
    is_verified: Mapped[bool] = mapped_column(Boolean, server_default=false())
    is_admin: Mapped[bool] = mapped_column(Boolean, server_default=false())
    oauth_provider: Mapped[str | None] = mapped_column(String(50))
    plan: Mapped[str] = mapped_column(String(10), server_default="free")
