"""Authentication and session management utilities."""
import os
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from sqlalchemy.orm import Session
from models import User, Session as SessionModel

# Password hasher using argon2id
ph = PasswordHasher()

# Secret key for token generation
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    # In development, generate a random key
    # In production, this should fail explicitly
    if os.getenv("ENVIRONMENT") == "production":
        raise ValueError("SECRET_KEY must be set in production environment")
    SECRET_KEY = secrets.token_hex(32)
    print(f"WARNING: Using auto-generated SECRET_KEY for development. Set SECRET_KEY in .env for production.")


def hash_password(password: str) -> str:
    """Hash a password using argon2id."""
    return ph.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    try:
        ph.verify(password_hash, password)
        return True
    except VerifyMismatchError:
        return False


def generate_session_token() -> str:
    """Generate a cryptographically secure random session token."""
    # 32 bytes = 256 bits of entropy
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash a session token using SHA-256."""
    return hashlib.sha256(token.encode()).hexdigest()


def create_user(db: Session, username: str, password: str) -> Optional[User]:
    """
    Create a new user with hashed password.
    
    Returns None if username already exists.
    """
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        return None
    
    # Hash password and create user
    password_hash = hash_password(password)
    user = User(username=username, password_hash=password_hash)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """
    Authenticate a user by username and password.
    
    Returns the user if credentials are valid, None otherwise.
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    return user


def create_session(db: Session, user_id: int, expires_in_seconds: int = 604800) -> tuple[str, SessionModel]:
    """
    Create a new session for a user.
    
    Returns (token, session_model) where token is the unhashed token to send to client.
    Default expiry is 7 days (604800 seconds).
    """
    token = generate_session_token()
    token_hash = hash_token(token)
    # Use naive datetime for SQLite compatibility
    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(seconds=expires_in_seconds)
    
    session = SessionModel(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return token, session


def validate_session(db: Session, token: str) -> Optional[User]:
    """
    Validate a session token and return the associated user.
    
    Returns None if token is invalid or expired.
    """
    token_hash = hash_token(token)
    session = db.query(SessionModel).filter(SessionModel.token_hash == token_hash).first()
    
    if not session:
        return None
    
    # Check if session is expired (use naive datetime for consistency)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    if session.expires_at < now:
        # Clean up expired session
        db.delete(session)
        db.commit()
        return None
    
    # Get the user
    user = db.query(User).filter(User.id == session.user_id).first()
    return user


def delete_session(db: Session, token: str) -> bool:
    """
    Delete a session by token.
    
    Returns True if session was deleted, False if not found.
    """
    token_hash = hash_token(token)
    session = db.query(SessionModel).filter(SessionModel.token_hash == token_hash).first()
    
    if not session:
        return False
    
    db.delete(session)
    db.commit()
    return True


def cleanup_expired_sessions(db: Session) -> int:
    """
    Delete all expired sessions.
    
    Returns the number of sessions deleted.
    """
    # Use naive datetime for consistency
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    count = db.query(SessionModel).filter(
        SessionModel.expires_at < now
    ).delete()
    db.commit()
    return count
