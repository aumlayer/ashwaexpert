"""init lead schema

Revision ID: 0001_init_lead
Revises: 
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0001_init_lead"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS lead;")
    bind = op.get_bind()
    insp = inspect(bind)

    if "leads" not in insp.get_table_names(schema="lead"):
        op.create_table(
            "leads",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("phone", sa.String(length=32), nullable=True),
            sa.Column("company", sa.String(length=255), nullable=True),
            sa.Column("message", sa.Text(), nullable=True),
            sa.Column("source", sa.String(length=32), nullable=False, server_default=sa.text("'website'")),
            sa.Column("status", sa.String(length=32), nullable=False, server_default=sa.text("'new'")),
            sa.Column("priority", sa.String(length=16), nullable=False, server_default=sa.text("'medium'")),
            sa.Column("assigned_to", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
            schema="lead",
        )

    if "lead_activities" not in insp.get_table_names(schema="lead"):
        op.create_table(
            "lead_activities",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("lead_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("activity_type", sa.String(length=32), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("performed_by", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.ForeignKeyConstraint(["lead_id"], ["lead.leads.id"]),
            schema="lead",
        )


def downgrade() -> None:
    op.drop_table("lead_activities", schema="lead")
    op.drop_table("leads", schema="lead")

