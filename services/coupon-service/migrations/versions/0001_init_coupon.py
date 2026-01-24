"""init coupon schema

Revision ID: 0001_init_coupon
Revises:
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0001_init_coupon"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS coupon;")
    bind = op.get_bind()
    insp = inspect(bind)

    if "coupons" not in insp.get_table_names(schema="coupon"):
        op.create_table(
            "coupons",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("code", sa.String(length=64), nullable=False, unique=True, index=True),
            sa.Column("kind", sa.String(length=16), nullable=False),  # promo | referral
            sa.Column("campaign_name", sa.String(length=64), nullable=True),
            sa.Column("discount_type", sa.String(length=16), nullable=False),  # percent | fixed
            sa.Column("discount_value", sa.Numeric(10, 2), nullable=False),
            sa.Column("applies_to", postgresql.JSONB(), nullable=True),
            sa.Column("min_amount", sa.Numeric(10, 2), nullable=True),
            sa.Column("max_redemptions", sa.Integer(), nullable=True),
            sa.Column("per_user_limit", sa.Integer(), nullable=True),
            sa.Column("redeemed_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
            sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True),
            sa.Column("valid_to", sa.DateTime(timezone=True), nullable=True),
            sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("referrer_user_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            schema="coupon",
        )

    if "referral_programs" not in insp.get_table_names(schema="coupon"):
        op.create_table(
            "referral_programs",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            # Fixed amount credit for referrer, applied once per successful referral activation.
            sa.Column("referrer_credit_amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("referred_percent", sa.Integer(), nullable=False),
            sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            schema="coupon",
        )

    if "coupon_redemptions" not in insp.get_table_names(schema="coupon"):
        op.create_table(
            "coupon_redemptions",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("coupon_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("redeemed_by_user_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("order_ref", sa.String(length=128), nullable=True),
            sa.Column("base_amount", sa.Numeric(10, 2), nullable=True),
            sa.Column("discount_amount", sa.Numeric(10, 2), nullable=False),
            sa.Column("created_credit_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("redeemed_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("metadata", postgresql.JSONB(), nullable=True),
            sa.ForeignKeyConstraint(["coupon_id"], ["coupon.coupons.id"]),
            schema="coupon",
        )

    if "user_credits" not in insp.get_table_names(schema="coupon"):
        op.create_table(
            "user_credits",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("credit_type", sa.String(length=16), nullable=False),  # percent | fixed
            sa.Column("credit_value", sa.Numeric(10, 2), nullable=False),
            sa.Column("status", sa.String(length=16), nullable=False, server_default=sa.text("'pending'")),
            sa.Column("source", sa.String(length=32), nullable=False, server_default=sa.text("'referral'")),
            sa.Column("applies_to", sa.String(length=32), nullable=True),
            sa.Column("order_ref", sa.String(length=128), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("applied_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("note", sa.Text(), nullable=True),
            schema="coupon",
        )

    # Note: default referral program is created by the service on startup (local dev).


def downgrade() -> None:
    op.drop_table("user_credits", schema="coupon")
    op.drop_table("coupon_redemptions", schema="coupon")
    op.drop_table("referral_programs", schema="coupon")
    op.drop_table("coupons", schema="coupon")

