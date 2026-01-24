"""init subscriber schema

Revision ID: 0001_init_subscriber
Revises: 
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

revision = "0001_init_subscriber"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS subscriber;")
    bind = op.get_bind()
    insp = inspect(bind)

    if "subscribers" not in insp.get_table_names(schema="subscriber"):
        op.create_table(
            "subscribers",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True, index=True),
            sa.Column("first_name", sa.String(length=100), nullable=False),
            sa.Column("last_name", sa.String(length=100), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("phone", sa.String(length=32), nullable=True),
            sa.Column("company_name", sa.String(length=255), nullable=True),
            sa.Column("gst_number", sa.String(length=32), nullable=True),
            sa.Column("pan_number", sa.String(length=32), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            schema="subscriber",
        )


def downgrade() -> None:
    op.drop_table("subscribers", schema="subscriber")
