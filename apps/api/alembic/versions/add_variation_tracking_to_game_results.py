"""Add variation tracking to game results

Revision ID: add_variation_tracking
Revises: ca755f88a36e
Create Date: 2026-01-18

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_variation_tracking'
down_revision = 'ca755f88a36e'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to game_results table
    op.add_column('game_results', sa.Column('word_length', sa.Integer(), nullable=False, server_default='5'))
    op.add_column('game_results', sa.Column('hard_mode', sa.Integer(), nullable=False, server_default='0'))
    
    # Create new index for variation-based queries
    op.create_index('idx_game_results_variation', 'game_results', ['user_id', 'word_length', 'hard_mode'])


def downgrade():
    # Drop index
    op.drop_index('idx_game_results_variation', table_name='game_results')
    
    # Drop columns
    op.drop_column('game_results', 'hard_mode')
    op.drop_column('game_results', 'word_length')
