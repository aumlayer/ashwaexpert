"""init assignment schema

Revision ID: 0001_init_assignment
Revises:
Create Date: 2026-01-25

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0001_init_assignment"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS assignment;")
    bind = op.get_bind()
    insp = inspect(bind)

    if "ticket_assignments" not in insp.get_table_names(schema="assignment"):
        op.create_table(
            "ticket_assignments",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("ticket_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("subscriber_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("technician_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("status", sa.String(length=16), nullable=False, server_default=sa.text("'assigned'")),
            sa.Column("assigned_by_user_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            schema="assignment",
        )


def downgrade() -> None:
    op.drop_table("ticket_assignments", schema="assignment")
