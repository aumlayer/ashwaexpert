"""init auth schema

Revision ID: 0001_init_auth
Revises: 
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

revision = "0001_init_auth"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS auth;")
    bind = op.get_bind()
    insp = inspect(bind)

    if "users" not in insp.get_table_names(schema="auth"):
        op.create_table(
            "users",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("email", sa.String(length=255), nullable=False, unique=True, index=True),
            sa.Column("phone", sa.String(length=32), nullable=True, unique=True, index=True),
            sa.Column("password_hash", sa.String(length=255), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("role", sa.String(length=32), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
            schema="auth",
        )

    if "otp_events" not in insp.get_table_names(schema="auth"):
        op.create_table(
            "otp_events",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("identifier", sa.String(length=255), nullable=False, index=True),
            sa.Column("otp_hash", sa.String(length=255), nullable=False),
            sa.Column("purpose", sa.String(length=32), nullable=False, index=True),
            sa.Column("is_used", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["auth.users.id"]),
            schema="auth",
        )

    if "sessions" not in insp.get_table_names(schema="auth"):
        op.create_table(
            "sessions",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("refresh_token", sa.String(length=255), nullable=False, unique=True, index=True),
            sa.Column("device_info", postgresql.JSONB(), nullable=True),
            sa.Column("ip_address", sa.String(length=64), nullable=True),
            sa.Column("user_agent", sa.Text(), nullable=True),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["auth.users.id"]),
            schema="auth",
        )


def downgrade() -> None:
    op.drop_table("sessions", schema="auth")
    op.drop_table("otp_events", schema="auth")
    op.drop_table("users", schema="auth")
