"""ticket workflow sla status history

Revision ID: 0002_ticket_workflow_sla
Revises: 0001_init_ticket
Create Date: 2026-01-25

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0002_ticket_workflow_sla"
down_revision = "0001_init_ticket"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    # Add assigned_technician_id and sla_due_at to tickets
    if "tickets" in insp.get_table_names(schema="ticket"):
        op.add_column(
            "tickets",
            sa.Column("assigned_technician_id", postgresql.UUID(as_uuid=True), nullable=True, index=True),
            schema="ticket",
        )
        op.add_column(
            "tickets",
            sa.Column("sla_due_at", sa.DateTime(timezone=True), nullable=True, index=True),
            schema="ticket",
        )

    # Create ticket_status_history
    if "ticket_status_history" not in insp.get_table_names(schema="ticket"):
        op.create_table(
            "ticket_status_history",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("ticket_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("from_status", sa.String(length=16), nullable=True),
            sa.Column("to_status", sa.String(length=16), nullable=False),
            sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("actor_role", sa.String(length=16), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            schema="ticket",
        )

    # Create sla_configs
    if "sla_configs" not in insp.get_table_names(schema="ticket"):
        op.create_table(
            "sla_configs",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("ticket_type", sa.String(length=32), nullable=False),
            sa.Column("priority", sa.String(length=16), nullable=False),
            sa.Column("due_hours", sa.Integer(), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            schema="ticket",
        )
        op.create_unique_constraint(
            "uq_sla_config_type_priority",
            "sla_configs",
            ["ticket_type", "priority"],
            schema="ticket",
        )


def downgrade() -> None:
    op.drop_table("sla_configs", schema="ticket")
    op.drop_table("ticket_status_history", schema="ticket")
    op.drop_column("tickets", "sla_due_at", schema="ticket")
    op.drop_column("tickets", "assigned_technician_id", schema="ticket")
