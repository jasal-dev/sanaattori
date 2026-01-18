"""Database models for users, sessions, and game results."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from database import Base


class User(Base):
    """User model for storing user account information."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Session(Base):
    """Session model for storing user sessions."""
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)

    # Create composite index for efficient cleanup and lookups
    __table_args__ = (
        Index('idx_sessions_user_expires', 'user_id', 'expires_at'),
    )


class GameResult(Base):
    """Game result model for storing individual game scores."""
    __tablename__ = "game_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)
    word_length = Column(Integer, nullable=False, default=5)
    hard_mode = Column(Integer, nullable=False, default=0)  # 0 for normal, 1 for hard
    played_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Create composite index for efficient leaderboard queries
    __table_args__ = (
        Index('idx_game_results_user_played', 'user_id', 'played_at'),
        Index('idx_game_results_variation', 'user_id', 'word_length', 'hard_mode'),
    )
