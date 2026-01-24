"""init plan schema

Revision ID: 0001_init_plan
Revises:
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0001_init_plan"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS plan;")
    bind = op.get_bind()
    insp = inspect(bind)

    if "plans" not in insp.get_table_names(schema="plan"):
        op.create_table(
            "plans",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("plan_code", sa.String(length=64), nullable=False, unique=True, index=True),
            sa.Column("name", sa.String(length=128), nullable=False),
            sa.Column("category", sa.String(length=32), nullable=False),  # rental | amc | service_bundle
            sa.Column(
                "billing_period",
                sa.String(length=16),
                nullable=False,
            ),  # monthly | quarterly | yearly | one_time
            sa.Column("price_amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("price_currency", sa.String(length=3), nullable=False, server_default=sa.text("'INR'")),
            sa.Column("trial_days", sa.Integer(), nullable=True),
            sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("limits", postgresql.JSONB(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            schema="plan",
        )


def downgrade() -> None:
    op.drop_table("plans", schema="plan")

