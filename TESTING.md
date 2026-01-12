# Testing

This document describes how to run the automated tests for Sanaattori.

## Frontend Tests

### Sanasto Game Tests

The Sanasto game tests use Jest and React Testing Library to test the core game logic.

### Running Sanasto Tests

```bash
cd apps/games/sanasto
npm test
```

### Test Coverage

The Sanasto game tests cover:
- **Wordle evaluation logic** (`app/utils/__tests__/evaluation.test.ts`)
  - Correct letter matching
  - Present letter matching (wrong position)
  - Absent letter marking
  - Duplicate letter handling
  - Case insensitivity
  - Finnish character support (ä, ö)
  
- **Hard mode validation** (`app/utils/__tests__/hardMode.test.ts`)
  - Constraint extraction from guesses
  - Green letter position enforcement
  - Yellow letter inclusion validation
  - Position restrictions for yellow letters
  
- **Statistics tracking** (`app/utils/__tests__/stats.test.ts`)
  - Win/loss tracking
  - Streak calculation
  - Stats persistence
  - Stats reset functionality

### Watch Mode

To run tests in watch mode for development:

```bash
cd apps/games/sanasto
npm run test:watch
```

## Backend Tests

The backend tests use pytest to test the FastAPI endpoints.

### Running Backend Tests

```bash
cd apps/api
source venv/bin/activate
pytest tests/ -v
```

### Test Coverage

The backend tests cover:
- **Health endpoint** - Verifies API is running
- **Word validation endpoint** - Tests the `/validate-guess` endpoint
  - Valid Finnish words
  - Invalid words
  - Wrong word lengths
  - Unsupported languages
  - Finnish character handling (ä, ö)

## Running All Tests

From the project root:

```bash
npm test
```

This will run both frontend and backend tests sequentially.

## End-to-End Tests

### Overview

The E2E tests use Playwright to test the entire application running in Docker containers. These tests verify:
- Landing page functionality
- Navigation from landing page to Sanasto game
- Game loading and asset delivery
- Integration between all components

### Running E2E Tests

**Automated (Recommended):**

From the project root:

```bash
npm run test:e2e
```

This script automatically:
1. Builds Docker containers
2. Starts all services (landing, sanasto, api, nginx, db)
3. Waits for services to be ready
4. Runs Playwright tests
5. Cleans up containers

**Interactive Mode (for debugging):**

```bash
# Start containers manually
docker compose up -d

# Run tests in UI mode
npm run test:e2e:ui
```

### E2E Test Coverage

The E2E tests cover:
- **Landing page** (`e2e-tests/tests/landing-page.spec.ts`)
  - Page title and subtitle display
  - Sanasto game card visibility
  - Placeholder cards for future games
  - Footer and layout
  
- **Navigation** (`e2e-tests/tests/navigation.spec.ts`)
  - Clicking from landing page to Sanasto game
  - Verifying game loads with correct assets
  - Back navigation to landing page
  - URL routing verification

### More Information

See the [E2E Tests README](e2e-tests/README.md) for detailed documentation.

## Test Files Structure

```
apps/
├── games/
│   └── sanasto/
│       └── app/
│           ├── utils/
│           │   └── __tests__/
│           │       ├── evaluation.test.ts
│           │       ├── hardMode.test.ts
│           │       └── stats.test.ts
│           ├── jest.config.ts
│           └── jest.setup.ts
└── api/
    └── tests/
        └── test_api.py

e2e-tests/
├── tests/
│   ├── landing-page.spec.ts
│   └── navigation.spec.ts
├── playwright.config.ts
└── package.json
```

## Adding New Tests

### Frontend

Create test files in `apps/games/sanasto/app/**/__tests__/` with the `.test.ts` or `.test.tsx` extension.

### Backend

Add test files in `apps/api/tests/` with the `test_*.py` pattern.

### E2E Tests

Add test files in `e2e-tests/tests/` with the `.spec.ts` extension. E2E tests should:
- Test user workflows across multiple components
- Verify integration between services
- Run against Docker containers
- Use Playwright for browser automation
