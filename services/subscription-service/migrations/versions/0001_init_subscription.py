"""init subscription schema

Revision ID: 0001_init_subscription
Revises:
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0001_init_subscription"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS subscription;")
    bind = op.get_bind()
    insp = inspect(bind)

    if "subscriptions" not in insp.get_table_names(schema="subscription"):
        op.create_table(
            "subscriptions",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("plan_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("status", sa.String(length=16), nullable=False, server_default=sa.text("'active'")),
            sa.Column("billing_period", sa.String(length=16), nullable=False),
            sa.Column("auto_renew", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("next_renewal_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("end_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("metadata", postgresql.JSONB(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            schema="subscription",
        )


def downgrade() -> None:
    op.drop_table("subscriptions", schema="subscription")

