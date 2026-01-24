"""order payment_intent_id

Revision ID: 0003_payment_intent
Revises: 0002_orders_tax
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0003_payment_intent"
down_revision = "0002_orders_tax"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    if "orders" in insp.get_table_names(schema="subscription"):
        cols = {c["name"] for c in insp.get_columns("orders", schema="subscription")}
        if "payment_intent_id" not in cols:
            op.add_column(
                "orders",
                sa.Column("payment_intent_id", postgresql.UUID(as_uuid=True), nullable=True),
                schema="subscription",
            )
            op.create_index(
                "ix_subscription_orders_payment_intent_id",
                "orders",
                ["payment_intent_id"],
                unique=False,
                schema="subscription",
            )


def downgrade() -> None:
    op.drop_index("ix_subscription_orders_payment_intent_id", table_name="orders", schema="subscription")
    op.drop_column("orders", "payment_intent_id", schema="subscription")

