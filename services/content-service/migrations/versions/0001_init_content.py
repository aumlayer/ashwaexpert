"""init content schema

Revision ID: 0001_init_content
Revises: 
Create Date: 2026-01-24
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0001_init_content"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS content;")
    bind = op.get_bind()
    insp = inspect(bind)

    if "case_studies" not in insp.get_table_names(schema="content"):
        op.create_table(
            "case_studies",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("slug", sa.String(length=255), nullable=False, unique=True, index=True),
            sa.Column("summary", sa.Text(), nullable=True),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("featured_image_url", sa.String(length=1024), nullable=True),
            sa.Column("status", sa.String(length=32), nullable=False, server_default=sa.text("'draft'")),
            sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("author_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("seo_title", sa.String(length=255), nullable=True),
            sa.Column("seo_description", sa.Text(), nullable=True),
            sa.Column("seo_keywords", sa.String(length=512), nullable=True),
            sa.Column("og_image_url", sa.String(length=1024), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
            schema="content",
        )


def downgrade() -> None:
    op.drop_table("case_studies", schema="content")

