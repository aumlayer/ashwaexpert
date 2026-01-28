"""add due_date and pdf_media_id to invoices

Revision ID: 0002_invoice_due_date_pdf_media
Revises: 0001_init_billing
Create Date: 2026-01-25

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_invoice_due_date_pdf_media"
down_revision = "0001_init_billing"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "invoices",
        sa.Column("due_date", sa.DateTime(timezone=True), nullable=True),
        schema="billing",
    )
    op.add_column(
        "invoices",
        sa.Column("pdf_media_id", postgresql.UUID(as_uuid=True), nullable=True),
        schema="billing",
    )


def downgrade() -> None:
    op.drop_column("invoices", "due_date", schema="billing")
    op.drop_column("invoices", "pdf_media_id", schema="billing")
