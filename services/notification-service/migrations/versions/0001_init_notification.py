"""init notification schema

Revision ID: 0001_init_notification
Revises:
Create Date: 2026-01-25

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0001_init_notification"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS notification;")
    bind = op.get_bind()
    insp = inspect(bind)

    if "delivery_logs" not in insp.get_table_names(schema="notification"):
        op.create_table(
            "delivery_logs",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("template_key", sa.String(length=64), nullable=False, index=True),
            sa.Column("channel", sa.String(length=16), nullable=False, index=True),
            sa.Column("recipient", sa.String(length=256), nullable=False),
            sa.Column("status", sa.String(length=16), nullable=False),
            sa.Column("provider_response", sa.String(length=512), nullable=True),
            sa.Column("context", postgresql.JSONB(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            schema="notification",
        )


def downgrade() -> None:
    op.drop_table("delivery_logs", schema="notification")
