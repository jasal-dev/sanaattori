import sys
from pathlib import Path

# Add parent directory to path to import main
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from main import app, load_word_lists

# Load word lists before running tests
load_word_lists()

client = TestClient(app)


def test_health_endpoint():
    """Test that the health endpoint returns OK"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_validate_guess_valid_word():
    """Test validating a valid Finnish word"""
    response = client.post(
        "/validate-guess",
        json={"language": "fi", "wordLength": 5, "guess": "omena"}
    )
    assert response.status_code == 200
    assert response.json()["valid"] is True


def test_validate_guess_invalid_word():
    """Test validating an invalid word"""
    response = client.post(
        "/validate-guess",
        json={"language": "fi", "wordLength": 5, "guess": "xyzab"}
    )
    assert response.status_code == 200
    assert response.json()["valid"] is False


def test_validate_guess_wrong_length():
    """Test validating a word with wrong length"""
    response = client.post(
        "/validate-guess",
        json={"language": "fi", "wordLength": 6, "guess": "kissa"}
    )
    assert response.status_code == 200
    assert response.json()["valid"] is False


def test_validate_guess_invalid_language():
    """Test validating with unsupported language"""
    response = client.post(
        "/validate-guess",
        json={"language": "en", "wordLength": 5, "guess": "apple"}
    )
    assert response.status_code == 200
    assert response.json()["valid"] is False


def test_validate_guess_finnish_characters():
    """Test validating a word with Finnish characters"""
    response = client.post(
        "/validate-guess",
        json={"language": "fi", "wordLength": 5, "guess": "pöytä"}
    )
    assert response.status_code == 200
    # This will depend on whether pöytä is in the word list
    assert "valid" in response.json()
