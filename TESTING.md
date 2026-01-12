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
```

## Adding New Tests

### Frontend

Create test files in `apps/games/sanasto/app/**/__tests__/` with the `.test.ts` or `.test.tsx` extension.

### Backend

Add test files in `apps/api/tests/` with the `test_*.py` pattern.
