"""expand lead fields and statuses

Revision ID: 0002_expand_lead_fields
Revises: 0001_init_lead
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "0002_expand_lead_fields"
down_revision = "0001_init_lead"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    cols = {c["name"] for c in insp.get_columns("leads", schema="lead")}

    def add(name: str, col: sa.Column) -> None:
        if name not in cols:
            op.add_column("leads", col, schema="lead")

    add("customer_type", sa.Column("customer_type", sa.String(length=32), nullable=True))
    add("service_category", sa.Column("service_category", sa.String(length=32), nullable=True))
    add("state", sa.Column("state", sa.String(length=64), nullable=True))
    add("city", sa.Column("city", sa.String(length=64), nullable=True))
    add("locality", sa.Column("locality", sa.String(length=128), nullable=True))
    add("preferred_datetime", sa.Column("preferred_datetime", sa.DateTime(timezone=True), nullable=True))
    add("appliance_category", sa.Column("appliance_category", sa.String(length=64), nullable=True))
    add("appliance_brand", sa.Column("appliance_brand", sa.String(length=64), nullable=True))
    add("appliance_model", sa.Column("appliance_model", sa.String(length=64), nullable=True))
    add("urgency", sa.Column("urgency", sa.String(length=16), nullable=True))
    add(
        "preferred_contact_method",
        sa.Column("preferred_contact_method", sa.String(length=16), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("leads", "preferred_contact_method", schema="lead")
    op.drop_column("leads", "urgency", schema="lead")
    op.drop_column("leads", "appliance_model", schema="lead")
    op.drop_column("leads", "appliance_brand", schema="lead")
    op.drop_column("leads", "appliance_category", schema="lead")
    op.drop_column("leads", "preferred_datetime", schema="lead")
    op.drop_column("leads", "locality", schema="lead")
    op.drop_column("leads", "city", schema="lead")
    op.drop_column("leads", "state", schema="lead")
    op.drop_column("leads", "service_category", schema="lead")
    op.drop_column("leads", "customer_type", schema="lead")

