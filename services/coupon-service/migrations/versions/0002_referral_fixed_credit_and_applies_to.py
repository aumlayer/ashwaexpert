"""referral fixed credit amount + credit applies_to

Revision ID: 0002_ref_fixed_credit
Revises: 0001_init_coupon
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "0002_ref_fixed_credit"
down_revision = "0001_init_coupon"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    # referral_programs: add fixed credit amount if missing
    if "referral_programs" in insp.get_table_names(schema="coupon"):
        rp_cols = {c["name"] for c in insp.get_columns("referral_programs", schema="coupon")}
        if "referrer_credit_amount" not in rp_cols:
            op.add_column(
                "referral_programs",
                sa.Column(
                    "referrer_credit_amount",
                    sa.Numeric(10, 2),
                    nullable=False,
                    server_default=sa.text("0"),
                ),
                schema="coupon",
            )

        # Backfill from old percent column if it exists (best-effort)
        if "referrer_percent" in rp_cols:
            # keep the old column but set a sensible default fixed amount in case data exists
            op.execute("UPDATE coupon.referral_programs SET referrer_credit_amount = 100 WHERE referrer_credit_amount = 0;")

    # user_credits: add applies_to if missing
    if "user_credits" in insp.get_table_names(schema="coupon"):
        uc_cols = {c["name"] for c in insp.get_columns("user_credits", schema="coupon")}
        if "applies_to" not in uc_cols:
            op.add_column("user_credits", sa.Column("applies_to", sa.String(length=32), nullable=True), schema="coupon")


def downgrade() -> None:
    op.drop_column("user_credits", "applies_to", schema="coupon")
    op.drop_column("referral_programs", "referrer_credit_amount", schema="coupon")

