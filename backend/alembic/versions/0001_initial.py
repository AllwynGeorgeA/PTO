"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-10-10
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TS = dict(type_=sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)


def _created_at() -> sa.Column:
    return sa.Column("created_at", **TS)


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=True),
        sa.Column("full_name", sa.String(100), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("is_admin", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("oauth_provider", sa.String(50), nullable=True),
        sa.Column("plan", sa.String(10), server_default="free", nullable=False),
        _created_at(),
        sa.CheckConstraint("plan IN ('free','pro','team')", name="ck_users_plan"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("token", sa.String(255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), server_default=sa.false(), nullable=False),
        _created_at(),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("ix_refresh_tokens_token", "refresh_tokens", ["token"], unique=True)

    op.create_table(
        "pto_plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("employee_name", sa.String(100), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("backup_person", sa.String(100), nullable=False),
        sa.Column("contact_email", sa.String(255), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("reminder_sent_at", sa.DateTime(timezone=True), nullable=True),
        _created_at(),
    )
    op.create_index("ix_pto_plans_user_id", "pto_plans", ["user_id"])

    op.create_table(
        "ai_replies",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("incoming_message", sa.Text(), nullable=False),
        sa.Column("tone", sa.String(30), nullable=False),
        sa.Column("generated_reply", sa.Text(), nullable=False),
        sa.Column("is_saved", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("source", sa.String(10), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        _created_at(),
        sa.CheckConstraint(
            "tone IN ('professional','funny','savage_office_safe','corporate_diplomatic','tanglish_manager')",  # noqa: E501
            name="ck_ai_replies_tone",
        ),
        sa.CheckConstraint("source IN ('openai','template')", name="ck_ai_replies_source"),
    )
    op.create_index("ix_ai_replies_user_id_created_at", "ai_replies", ["user_id", "created_at"])

    op.create_table(
        "handover_tasks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column(
            "pto_plan_id",
            sa.Integer(),
            sa.ForeignKey("pto_plans.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("priority", sa.String(10), server_default="medium", nullable=False),
        sa.Column("backup_person", sa.String(100), nullable=True),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("status", sa.String(10), server_default="pending", nullable=False),
        _created_at(),
        sa.CheckConstraint(
            "priority IN ('low','medium','high')", name="ck_handover_tasks_priority"
        ),
        sa.CheckConstraint("status IN ('pending','completed')", name="ck_handover_tasks_status"),
    )
    op.create_index("ix_handover_tasks_user_id", "handover_tasks", ["user_id"])
    op.create_index("ix_handover_tasks_pto_plan_id", "handover_tasks", ["pto_plan_id"])

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("plan", sa.String(10), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("dodo_customer_id", sa.String(100), nullable=True),
        sa.Column("dodo_subscription_id", sa.String(100), nullable=True),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
        _created_at(),
        sa.CheckConstraint("plan IN ('free','pro','team')", name="ck_subscriptions_plan"),
    )
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])
    op.create_index(
        "ix_subscriptions_dodo_subscription_id", "subscriptions", ["dodo_subscription_id"]
    )


def downgrade() -> None:
    for table in (
        "subscriptions",
        "handover_tasks",
        "ai_replies",
        "pto_plans",
        "refresh_tokens",
        "users",
    ):
        op.drop_table(table)
