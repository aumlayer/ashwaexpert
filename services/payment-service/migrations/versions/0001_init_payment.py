"""init payment schema

Revision ID: 0001_init_payment
Revises:
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0001_init_payment"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS payment;")
    bind = op.get_bind()
    insp = inspect(bind)

    if "payment_intents" not in insp.get_table_names(schema="payment"):
        op.create_table(
            "payment_intents",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("reference_type", sa.String(length=64), nullable=False, index=True),
            sa.Column("reference_id", sa.String(length=128), nullable=False, index=True),
            sa.Column("amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("currency", sa.String(length=3), nullable=False, server_default=sa.text("'INR'")),
            sa.Column("status", sa.String(length=16), nullable=False, server_default=sa.text("'created'")),
            sa.Column("provider", sa.String(length=32), nullable=False, server_default=sa.text("'mock'")),
            sa.Column("meta", postgresql.JSONB(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            schema="payment",
        )


def downgrade() -> None:
    op.drop_table("payment_intents", schema="payment")

