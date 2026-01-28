"""subscription lifecycle fields

Revision ID: 0004_subscription_lifecycle_fields
Revises: 0003_payment_intent
Create Date: 2026-01-25

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0004_subscription_lifecycle_fields"
down_revision = "0003_payment_intent"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if "subscriptions" in insp.get_table_names(schema="subscription"):
        cols = {c["name"] for c in insp.get_columns("subscriptions", schema="subscription")}

        # Add cancellation fields
        if "cancel_requested_at" not in cols:
            op.add_column(
                "subscriptions",
                sa.Column("cancel_requested_at", sa.DateTime(timezone=True), nullable=True),
                schema="subscription",
            )
        if "cancel_effective_at" not in cols:
            op.add_column(
                "subscriptions",
                sa.Column("cancel_effective_at", sa.DateTime(timezone=True), nullable=True, index=True),
                schema="subscription",
            )
        if "cancel_reason" not in cols:
            op.add_column(
                "subscriptions",
                sa.Column("cancel_reason", sa.Text(), nullable=True),
                schema="subscription",
            )

        # Add plan change fields
        if "plan_change_requested_plan_id" not in cols:
            op.add_column(
                "subscriptions",
                sa.Column("plan_change_requested_plan_id", postgresql.UUID(as_uuid=True), nullable=True),
                schema="subscription",
            )
        if "plan_change_requested_at" not in cols:
            op.add_column(
                "subscriptions",
                sa.Column("plan_change_requested_at", sa.DateTime(timezone=True), nullable=True),
                schema="subscription",
            )
        if "plan_change_effective_at" not in cols:
            op.add_column(
                "subscriptions",
                sa.Column("plan_change_effective_at", sa.DateTime(timezone=True), nullable=True, index=True),
                schema="subscription",
            )
        if "plan_change_mode" not in cols:
            op.add_column(
                "subscriptions",
                sa.Column("plan_change_mode", sa.String(16), nullable=True, server_default=sa.text("'next_cycle'")),
                schema="subscription",
            )

        # Optional: last_billed_invoice_id
        if "last_billed_invoice_id" not in cols:
            op.add_column(
                "subscriptions",
                sa.Column("last_billed_invoice_id", postgresql.UUID(as_uuid=True), nullable=True),
                schema="subscription",
            )

        # Ensure plan_id is indexed (may already exist)
        try:
            op.create_index(
                "ix_subscription_subscriptions_plan_id",
                "subscriptions",
                ["plan_id"],
                unique=False,
                schema="subscription",
            )
        except Exception:
            pass  # Index may already exist

        # Update status enum constraint (PostgreSQL enum handling)
        # Note: We'll handle status enum expansion in application code
        # The column is String(16), so we can store new values without migration


def downgrade() -> None:
    op.drop_column("subscriptions", "last_billed_invoice_id", schema="subscription")
    op.drop_column("subscriptions", "plan_change_mode", schema="subscription")
    op.drop_column("subscriptions", "plan_change_effective_at", schema="subscription")
    op.drop_column("subscriptions", "plan_change_requested_at", schema="subscription")
    op.drop_column("subscriptions", "plan_change_requested_plan_id", schema="subscription")
    op.drop_column("subscriptions", "cancel_reason", schema="subscription")
    op.drop_column("subscriptions", "cancel_effective_at", schema="subscription")
    op.drop_column("subscriptions", "cancel_requested_at", schema="subscription")
