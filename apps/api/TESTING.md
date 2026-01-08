# Testing Guide

This document explains how to run tests for the Sanaattori backend.

## Test Structure

- `tests/test_api.py` - Basic API endpoint tests
- `tests/test_integration.py` - Full integration tests with database

## Running Tests Locally

### Prerequisites

Make sure you have the Python dependencies installed:

```bash
cd apps/api
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Run All Tests

```bash
# From the apps/api directory
pytest

# With verbose output
pytest -v

# With coverage report
pytest --cov=. --cov-report=html
```

### Run Specific Test Files

```bash
# Run only integration tests
pytest tests/test_integration.py

# Run only basic API tests
pytest tests/test_api.py
```

### Run Specific Test Classes or Functions

```bash
# Run a specific test class
pytest tests/test_integration.py::TestAuthentication

# Run a specific test function
pytest tests/test_integration.py::TestAuthentication::test_successful_registration
```

## Running Tests in Docker

You can also run tests inside a Docker container:

```bash
# From the repository root
docker-compose exec api pytest

# Or build and run a one-off container
docker-compose run api pytest
```

## Running Tests in CI

The tests are designed to run in CI environments. They use SQLite for the test database, so no external database is required.

### GitHub Actions Example

Add this to `.github/workflows/test.yml`:

```yaml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd apps/api
          pip install -r requirements.txt
      
      - name: Run tests
        run: |
          cd apps/api
          pytest -v
```

## Integration Tests with PostgreSQL (Optional)

For more realistic integration tests, you can use a PostgreSQL test database:

### Using Docker Compose

1. Create a `docker-compose.test.yml`:

```yaml
version: '3.8'

services:
  test-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: test_sanaattori
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_pass
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data  # Use tmpfs for faster tests

  test-api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://test_user:test_pass@test-db:5432/test_sanaattori
      SECRET_KEY: test-secret-key
      ENVIRONMENT: testing
    depends_on:
      - test-db
    command: pytest -v
```

2. Run tests:

```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### Modifying Tests to Use PostgreSQL

Update `tests/test_integration.py`:

```python
import os

# Use environment variable for database URL
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "sqlite:///./test.db"  # Fallback to SQLite
)

engine = create_engine(TEST_DATABASE_URL)
```

Then run with:

```bash
TEST_DATABASE_URL=postgresql://test_user:test_pass@localhost:5433/test_sanaattori pytest
```

## Test Coverage

The integration tests cover:

### Authentication
- ✅ Successful user registration
- ✅ Duplicate username registration returns 409
- ✅ Input validation (short username/password)
- ✅ Successful login with cookie setting
- ✅ Login with wrong password returns 401
- ✅ Login with nonexistent user returns 401

### Session Management
- ✅ Session cookie is set on login
- ✅ Authenticated requests work with valid session
- ✅ Unauthenticated requests fail with 401
- ✅ Logout clears session and cookie
- ✅ Invalid/tampered session tokens are rejected
- ✅ Multiple sessions per user are supported

### Game Results
- ✅ Successful game result submission
- ✅ Unauthenticated users cannot submit results
- ✅ Multiple results can be submitted
- ✅ Negative scores are rejected
- ✅ Zero scores are rejected
- ✅ Timestamp is automatically set

### Leaderboards
- ✅ Weekly leaderboard with correct date range
- ✅ All-time leaderboard
- ✅ Correct ranking by total score
- ✅ Tiebreaker by games played (fewer is better)
- ✅ Limit parameter works
- ✅ Empty leaderboards return empty arrays

### Security
- ✅ Passwords never returned in responses
- ✅ Session token tampering detected
- ✅ Cookie security flags set correctly
- ✅ Session expiry logic (implicit in validation)

## Troubleshooting

### Test Database Issues

If you see database-related errors:

```bash
# Clean up test database
rm test.db

# Or if using PostgreSQL
docker-compose -f docker-compose.test.yml down -v
```

### Import Errors

If you see import errors:

```bash
# Make sure you're in the apps/api directory
cd apps/api

# And have activated the virtual environment
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Fixture Errors

If fixtures aren't working:

```bash
# Make sure pytest is finding your tests
pytest --collect-only

# Check that test files match the pattern test_*.py or *_test.py
```

## Adding New Tests

When adding new features, please add corresponding tests:

1. **Unit tests** for individual functions in `auth.py`, `database.py`, etc.
2. **Integration tests** for API endpoints in `test_integration.py`
3. **Edge cases** for security-critical features

Example test structure:

```python
class TestNewFeature:
    """Test the new feature."""
    
    def test_success_case(self, client):
        """Test successful usage."""
        response = client.post("/endpoint", json={"data": "value"})
        assert response.status_code == 200
    
    def test_error_case(self, client):
        """Test error handling."""
        response = client.post("/endpoint", json={"invalid": "data"})
        assert response.status_code == 400
```

## Code Coverage Goals

Aim for:
- ✅ 80%+ overall coverage
- ✅ 90%+ coverage for security-critical code (auth, sessions)
- ✅ 100% coverage for error handling paths

Check coverage:

```bash
pytest --cov=. --cov-report=term-missing
```

## Continuous Integration

Tests should be run on:
- Every push to feature branches
- All pull requests
- Before merging to main

Ensure tests:
- ✅ Run in under 2 minutes
- ✅ Are deterministic (no flaky tests)
- ✅ Clean up after themselves (no leftover data)
- ✅ Can run in parallel (pytest-xdist)
