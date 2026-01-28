"""subscription outbox table

Revision ID: 0006_subscription_outbox
Revises: 0005_subscription_events
Create Date: 2026-01-25

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0006_subscription_outbox"
down_revision = "0005_subscription_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if "subscription_outbox" not in insp.get_table_names(schema="subscription"):
        op.create_table(
            "subscription_outbox",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("topic", sa.String(64), nullable=False, index=True),
            sa.Column("event_name", sa.String(64), nullable=False, index=True),
            sa.Column("payload", postgresql.JSONB, nullable=False),
            sa.Column("status", sa.String(16), nullable=False, server_default=sa.text("'pending'"), index=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, index=True),
            sa.Column("last_attempt_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("attempt_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
            schema="subscription",
        )


def downgrade() -> None:
    op.drop_table("subscription_outbox", schema="subscription")
