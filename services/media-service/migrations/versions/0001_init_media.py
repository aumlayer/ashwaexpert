"""init media schema

Revision ID: 0001_init_media
Revises:
Create Date: 2026-01-25

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0001_init_media"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS media;")
    bind = op.get_bind()
    insp = inspect(bind)

    if "media_objects" not in insp.get_table_names(schema="media"):
        op.create_table(
            "media_objects",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("owner_type", sa.String(length=32), nullable=False, index=True),
            sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=False, index=True),
            sa.Column("file_path", sa.String(length=512), nullable=False),
            sa.Column("content_type", sa.String(length=64), nullable=False, server_default=sa.text("'application/pdf'")),
            sa.Column("file_size", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            schema="media",
        )


def downgrade() -> None:
    op.drop_table("media_objects", schema="media")
