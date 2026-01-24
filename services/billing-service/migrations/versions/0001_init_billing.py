"""init billing schema

Revision ID: 0001_init_billing
Revises:
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0001_init_billing"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS billing;")
    bind = op.get_bind()
    insp = inspect(bind)

    if "invoice_sequences" not in insp.get_table_names(schema="billing"):
        op.create_table(
            "invoice_sequences",
            sa.Column("fiscal_year", sa.String(length=16), primary_key=True),
            sa.Column("next_num", sa.Integer(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            schema="billing",
        )

    if "invoices" not in insp.get_table_names(schema="billing"):
        op.create_table(
            "invoices",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("invoice_number", sa.String(length=32), nullable=False, unique=True, index=True),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True, index=True),
            sa.Column("status", sa.String(length=16), nullable=False, server_default=sa.text("'issued'")),
            sa.Column("base_amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("discount_amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("credit_applied_amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("amount_before_gst", sa.Numeric(10, 2), nullable=False),
            sa.Column("gst_percent", sa.Numeric(5, 2), nullable=False),
            sa.Column("gst_amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("total_amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("meta", postgresql.JSONB(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            schema="billing",
        )


def downgrade() -> None:
    op.drop_table("invoices", schema="billing")
    op.drop_table("invoice_sequences", schema="billing")

