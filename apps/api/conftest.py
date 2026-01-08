"""Pytest configuration for API tests."""
import os
import sys
from pathlib import Path

# Set testing environment variables before importing anything
os.environ["TESTING"] = "true"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["ENVIRONMENT"] = "testing"

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))
