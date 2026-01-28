"""payment attempts for gateway create/retry/reconcile

Revision ID: 0004_payment_attempts
Revises: 0003_webhook_events
Create Date: 2026-01-26

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0004_payment_attempts"
down_revision = "0003_webhook_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if "payment_attempts" not in insp.get_table_names(schema="payment"):
        op.create_table(
            "payment_attempts",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column(
                "intent_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("payment.payment_intents.id", ondelete="CASCADE"),
                nullable=False,
                index=True,
            ),
            sa.Column("operation", sa.String(length=16), nullable=False),
            sa.Column("idempotency_key", sa.String(length=128), nullable=True),
            sa.Column("gateway_order_id", sa.String(length=128), nullable=True),
            sa.Column("payment_session_id", sa.String(length=256), nullable=True),
            sa.Column("request_hash", sa.String(length=64), nullable=True),
            sa.Column("raw_request", postgresql.JSONB(), nullable=True),
            sa.Column("raw_response", postgresql.JSONB(), nullable=True),
            sa.Column("status", sa.String(length=16), nullable=False, server_default=sa.text("'created'")),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            schema="payment",
        )
        op.create_index(
            "ix_payment_payment_attempts_intent_id",
            "payment_attempts",
            ["intent_id"],
            unique=False,
            schema="payment",
        )
        op.create_index(
            "ix_payment_payment_attempts_operation",
            "payment_attempts",
            ["operation"],
            unique=False,
            schema="payment",
        )
        op.create_index(
            "ux_payment_payment_attempts_idempotency",
            "payment_attempts",
            ["intent_id", "operation", "idempotency_key"],
            unique=True,
            schema="payment",
            postgresql_where=sa.text("idempotency_key IS NOT NULL"),
        )


def downgrade() -> None:
    op.drop_index("ux_payment_payment_attempts_idempotency", table_name="payment_attempts", schema="payment")
    op.drop_index("ix_payment_payment_attempts_operation", table_name="payment_attempts", schema="payment")
    op.drop_index("ix_payment_payment_attempts_intent_id", table_name="payment_attempts", schema="payment")
    op.drop_table("payment_attempts", schema="payment")

