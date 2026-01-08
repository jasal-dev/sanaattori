"""Database configuration and models."""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Only load .env file if not in test mode
if os.getenv("TESTING") != "true":
    load_dotenv()

def get_database_url():
    """Get database URL from environment or default."""
    return os.getenv("DATABASE_URL", "postgresql://sanaattori:changeme@localhost:5432/sanaattori")

DATABASE_URL = get_database_url()

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for getting database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
