"""add user lead capabilities

Revision ID: 0002_add_user_capabilities
Revises: 0001_init_auth
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "0002_add_user_capabilities"
down_revision = "0001_init_auth"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)
    cols = {c["name"] for c in insp.get_columns("users", schema="auth")}

    if "can_assign_leads" not in cols:
        op.add_column(
            "users",
            sa.Column(
                "can_assign_leads",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            ),
            schema="auth",
        )
    if "can_manage_unassigned_leads" not in cols:
        op.add_column(
            "users",
            sa.Column(
                "can_manage_unassigned_leads",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            ),
            schema="auth",
        )

    # Defaults for existing rows
    op.execute(
        "UPDATE auth.users SET can_assign_leads = true, can_manage_unassigned_leads = true WHERE role = 'admin';"
    )
    op.execute("UPDATE auth.users SET can_manage_unassigned_leads = true WHERE role = 'cms_user';")


def downgrade() -> None:
    op.drop_column("users", "can_manage_unassigned_leads", schema="auth")
    op.drop_column("users", "can_assign_leads", schema="auth")

