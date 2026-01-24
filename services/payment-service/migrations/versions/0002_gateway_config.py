"""gateway config

Revision ID: 0002_gateway_config
Revises: 0001_init_payment
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0002_gateway_config"
down_revision = "0001_init_payment"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    if "gateway_configs" not in insp.get_table_names(schema="payment"):
        op.create_table(
            "gateway_configs",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("provider", sa.String(length=32), nullable=False),
            sa.Column("mode", sa.String(length=16), nullable=False, server_default=sa.text("'sandbox'")),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("credentials", postgresql.JSONB(), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            schema="payment",
        )


def downgrade() -> None:
    op.drop_table("gateway_configs", schema="payment")

