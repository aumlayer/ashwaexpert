"""credit ledger + proration invoice support

Revision ID: 0003_credits_proration_invoices
Revises: 0002_invoice_due_date_pdf_media
Create Date: 2026-01-26

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0003_credits_proration_invoices"
down_revision = "0002_invoice_due_date_pdf_media"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    # --- invoices enhancements (credits + proration) ---
    if "invoices" in insp.get_table_names(schema="billing"):
        cols = {c["name"] for c in insp.get_columns("invoices", schema="billing")}

        # allow proration invoices without an order_id
        if "order_id" in cols:
            # best-effort: make nullable (Postgres UNIQUE allows multiple NULLs)
            op.alter_column(
                "invoices",
                "order_id",
                existing_type=postgresql.UUID(as_uuid=True),
                nullable=True,
                schema="billing",
            )

        if "invoice_type" not in cols:
            op.add_column(
                "invoices",
                sa.Column(
                    "invoice_type",
                    sa.String(length=16),
                    nullable=False,
                    server_default=sa.text("'order'"),
                ),
                schema="billing",
            )

        if "subscription_id" not in cols:
            op.add_column(
                "invoices",
                sa.Column("subscription_id", postgresql.UUID(as_uuid=True), nullable=True),
                schema="billing",
            )
            op.create_index(
                "ix_billing_invoices_subscription_id",
                "invoices",
                ["subscription_id"],
                unique=False,
                schema="billing",
            )

        if "paid_amount" not in cols:
            op.add_column(
                "invoices",
                sa.Column(
                    "paid_amount",
                    sa.Numeric(10, 2),
                    nullable=False,
                    server_default=sa.text("0"),
                ),
                schema="billing",
            )

        if "due_amount" not in cols:
            op.add_column(
                "invoices",
                sa.Column(
                    "due_amount",
                    sa.Numeric(10, 2),
                    nullable=False,
                    server_default=sa.text("0"),
                ),
                schema="billing",
            )

        # Backfill paid_amount/due_amount for existing invoices
        op.execute(
            """
            UPDATE billing.invoices
            SET
              paid_amount = CASE WHEN status = 'paid' THEN total_amount ELSE 0 END,
              due_amount  = CASE WHEN status = 'paid' THEN 0 ELSE (total_amount - COALESCE(credit_applied_amount, 0)) END
            """
        )

    # --- credit ledger tables ---
    if "credit_ledger_accounts" not in insp.get_table_names(schema="billing"):
        op.create_table(
            "credit_ledger_accounts",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("subscriber_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("currency", sa.String(length=3), nullable=False, server_default=sa.text("'INR'")),
            sa.Column("balance_amount", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            sa.UniqueConstraint("subscriber_id", "currency", name="uq_credit_ledger_account_subscriber_currency"),
            schema="billing",
        )
        op.create_index(
            "ix_billing_credit_ledger_accounts_subscriber_id",
            "credit_ledger_accounts",
            ["subscriber_id"],
            unique=False,
            schema="billing",
        )

    if "credit_ledger_entries" not in insp.get_table_names(schema="billing"):
        op.create_table(
            "credit_ledger_entries",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column(
                "account_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("billing.credit_ledger_accounts.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("direction", sa.String(length=8), nullable=False),  # credit|debit
            sa.Column("amount", sa.Numeric(12, 2), nullable=False),
            sa.Column("reason", sa.String(length=32), nullable=False),
            sa.Column("reference_type", sa.String(length=32), nullable=False),
            sa.Column("reference_id", sa.String(length=128), nullable=False),
            sa.Column("idempotency_key", sa.String(length=128), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("created_by_role", sa.String(length=16), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            schema="billing",
        )
        op.create_index(
            "ix_billing_credit_ledger_entries_account_id",
            "credit_ledger_entries",
            ["account_id"],
            unique=False,
            schema="billing",
        )
        op.create_index(
            "ix_billing_credit_ledger_entries_reference",
            "credit_ledger_entries",
            ["reference_type", "reference_id"],
            unique=False,
            schema="billing",
        )
        op.create_index(
            "ux_billing_credit_ledger_entries_idempotency",
            "credit_ledger_entries",
            ["account_id", "idempotency_key"],
            unique=True,
            schema="billing",
            postgresql_where=sa.text("idempotency_key IS NOT NULL"),
        )

    if "invoice_credit_applications" not in insp.get_table_names(schema="billing"):
        op.create_table(
            "invoice_credit_applications",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column(
                "invoice_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("billing.invoices.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "account_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("billing.credit_ledger_accounts.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "debit_entry_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("billing.credit_ledger_entries.id", ondelete="RESTRICT"),
                nullable=False,
            ),
            sa.Column("applied_amount", sa.Numeric(12, 2), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.UniqueConstraint("invoice_id", "debit_entry_id", name="uq_invoice_credit_application_invoice_debit"),
            schema="billing",
        )
        op.create_index(
            "ix_billing_invoice_credit_applications_invoice_id",
            "invoice_credit_applications",
            ["invoice_id"],
            unique=False,
            schema="billing",
        )


def downgrade() -> None:
    # credit ledger tables
    op.drop_index("ix_billing_invoice_credit_applications_invoice_id", table_name="invoice_credit_applications", schema="billing")
    op.drop_table("invoice_credit_applications", schema="billing")

    op.drop_index(
        "ux_billing_credit_ledger_entries_idempotency",
        table_name="credit_ledger_entries",
        schema="billing",
    )
    op.drop_index("ix_billing_credit_ledger_entries_reference", table_name="credit_ledger_entries", schema="billing")
    op.drop_index("ix_billing_credit_ledger_entries_account_id", table_name="credit_ledger_entries", schema="billing")
    op.drop_table("credit_ledger_entries", schema="billing")

    op.drop_index("ix_billing_credit_ledger_accounts_subscriber_id", table_name="credit_ledger_accounts", schema="billing")
    op.drop_table("credit_ledger_accounts", schema="billing")

    # invoices columns
    op.drop_column("invoices", "due_amount", schema="billing")
    op.drop_column("invoices", "paid_amount", schema="billing")
    op.drop_index("ix_billing_invoices_subscription_id", table_name="invoices", schema="billing")
    op.drop_column("invoices", "subscription_id", schema="billing")
    op.drop_column("invoices", "invoice_type", schema="billing")
    op.alter_column(
        "invoices",
        "order_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
        schema="billing",
    )

