"""subscription events table

Revision ID: 0005_subscription_events
Revises: 0004_subscription_lifecycle_fields
Create Date: 2026-01-25

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0005_subscription_events"
down_revision = "0004_subscription_lifecycle_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if "subscription_events" not in insp.get_table_names(schema="subscription"):
        op.create_table(
            "subscription_events",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("subscription_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("event_type", sa.String(32), nullable=False, index=True),
            sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("actor_role", sa.String(16), nullable=True),
            sa.Column("from_status", sa.String(16), nullable=True),
            sa.Column("to_status", sa.String(16), nullable=True),
            sa.Column("from_plan_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("to_plan_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("payload", postgresql.JSONB, nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
            schema="subscription",
        )


def downgrade() -> None:
    op.drop_table("subscription_events", schema="subscription")
