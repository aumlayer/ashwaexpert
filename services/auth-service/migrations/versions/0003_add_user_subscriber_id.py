"""add subscriber_id to users

Revision ID: 0003_add_user_subscriber_id
Revises: 0002_add_user_capabilities
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0003_add_user_subscriber_id"
down_revision = "0002_add_user_capabilities"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    cols = {c["name"] for c in insp.get_columns("users", schema="auth")}
    if "subscriber_id" not in cols:
        op.add_column(
            "users",
            sa.Column("subscriber_id", postgresql.UUID(as_uuid=True), nullable=True),
            schema="auth",
        )
        op.create_index(
            "ix_auth_users_subscriber_id",
            "users",
            ["subscriber_id"],
            unique=False,
            schema="auth",
        )


def downgrade() -> None:
    op.drop_index("ix_auth_users_subscriber_id", table_name="users", schema="auth")
    op.drop_column("users", "subscriber_id", schema="auth")

