"""Add github_access_token to User

Revision ID: f3e1a7b8c9d0
Revises: 47d01a9013eb
Create Date: 2026-05-20 23:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f3e1a7b8c9d0'
down_revision = '47d01a9013eb'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('github_access_token', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'github_access_token')
