"""orders + tax configs + renewal anchor

Revision ID: 0002_orders_tax
Revises: 0001_init_subscription
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0002_orders_tax"
down_revision = "0001_init_subscription"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    # subscriptions: add renewal anchor + override
    if "subscriptions" in insp.get_table_names(schema="subscription"):
        cols = {c["name"] for c in insp.get_columns("subscriptions", schema="subscription")}
        if "renewal_anchor_at" not in cols:
            op.add_column(
                "subscriptions",
                sa.Column(
                    "renewal_anchor_at",
                    sa.DateTime(timezone=True),
                    nullable=False,
                    server_default=sa.text("now()"),
                ),
                schema="subscription",
            )
        if "next_renewal_override_at" not in cols:
            op.add_column(
                "subscriptions",
                sa.Column("next_renewal_override_at", sa.DateTime(timezone=True), nullable=True),
                schema="subscription",
            )

    # tax configs
    if "tax_configs" not in insp.get_table_names(schema="subscription"):
        op.create_table(
            "tax_configs",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("service_type", sa.String(length=16), nullable=False, unique=True, index=True),
            sa.Column("gst_percent", sa.Numeric(5, 2), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            schema="subscription",
        )

    # orders table
    if "orders" not in insp.get_table_names(schema="subscription"):
        op.create_table(
            "orders",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("subscription_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("order_type", sa.String(length=16), nullable=False),
            sa.Column("service_type", sa.String(length=16), nullable=False),
            sa.Column("base_amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("discount_amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("credit_applied_amount", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0")),
            sa.Column("amount_before_gst", sa.Numeric(10, 2), nullable=False),
            sa.Column("gst_percent", sa.Numeric(5, 2), nullable=False),
            sa.Column("gst_amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("total_amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("promo_code", sa.String(length=64), nullable=True),
            sa.Column("referral_code", sa.String(length=64), nullable=True),
            sa.Column("applied_codes", postgresql.JSONB(), nullable=True),
            sa.Column("applied_credit_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("status", sa.String(length=16), nullable=False, server_default=sa.text("'paid'")),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            schema="subscription",
        )


def downgrade() -> None:
    op.drop_table("orders", schema="subscription")
    op.drop_table("tax_configs", schema="subscription")
    op.drop_column("subscriptions", "next_renewal_override_at", schema="subscription")
    op.drop_column("subscriptions", "renewal_anchor_at", schema="subscription")

