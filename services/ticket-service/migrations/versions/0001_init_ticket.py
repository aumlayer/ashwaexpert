"""init ticket schema

Revision ID: 0001_init_ticket
Revises:
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0001_init_ticket"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS ticket;")
    bind = op.get_bind()
    insp = inspect(bind)

    if "tickets" not in insp.get_table_names(schema="ticket"):
        op.create_table(
            "tickets",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("ticket_number", sa.String(length=32), nullable=False, unique=True, index=True),
            sa.Column("subscriber_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("subscription_id", postgresql.UUID(as_uuid=True), nullable=True, index=True),
            sa.Column("ticket_type", sa.String(length=32), nullable=False),
            sa.Column("priority", sa.String(length=16), nullable=False, server_default=sa.text("'medium'")),
            sa.Column("status", sa.String(length=16), nullable=False, server_default=sa.text("'created'")),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("location_address", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            schema="ticket",
        )


def downgrade() -> None:
    op.drop_table("tickets", schema="ticket")

