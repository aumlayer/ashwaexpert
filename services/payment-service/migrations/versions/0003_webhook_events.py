"""payment webhook events

Revision ID: 0003_webhook_events
Revises: 0002_gateway_config
Create Date: 2026-01-25

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0003_webhook_events"
down_revision = "0002_gateway_config"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    if "payment_webhook_events" not in insp.get_table_names(schema="payment"):
        op.create_table(
            "payment_webhook_events",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("provider", sa.String(length=32), nullable=False, index=True),
            sa.Column("event_id", sa.String(length=256), nullable=False, index=True),
            sa.Column("raw_payload", postgresql.JSONB(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            schema="payment",
        )


def downgrade() -> None:
    op.drop_table("payment_webhook_events", schema="payment")
