# End-to-End Tests

This directory contains end-to-end tests for the Sanaattori platform that run against Docker containers.

## Overview

The E2E tests use Playwright to test the entire application stack running in Docker containers:
- Landing page
- Sanasto game
- Navigation between components
- API integration

## Running Tests

### Quick Start

From the repository root, run:

```bash
npm run test:e2e
```

This script will:
1. Build Docker containers
2. Start all services (landing, sanasto, api, nginx, db)
3. Wait for services to be ready
4. Run Playwright tests
5. Clean up containers

### Interactive Mode

To run tests in UI mode for debugging:

```bash
npm run test:e2e:ui
```

**Note:** You must manually start the Docker containers first:

```bash
docker compose up -d
```

### Manual Test Execution

If you want more control:

```bash
# Start containers
docker compose up -d

# Wait for services to be ready
curl http://localhost:8080

# Run tests
cd e2e-tests
npm install
npx playwright install chromium
npm test

# Clean up
docker compose down
```

## Test Structure

- `tests/landing-page.spec.ts` - Tests for the landing page
- `tests/navigation.spec.ts` - Tests for navigation between landing and Sanasto

## Configuration

The Playwright configuration is in `playwright.config.ts`:
- Base URL: `http://localhost:8080`
- Single worker to avoid container conflicts
- Automatic screenshots on failure
- Trace recording on first retry

## CI/CD Integration

The E2E tests are designed to run in CI/CD pipelines. The `run-e2e-tests.sh` script handles:
- Container lifecycle management
- Service health checks
- Cleanup on exit (even if tests fail)

## Troubleshooting

### Services not starting

Check Docker logs:
```bash
docker compose logs
```

### Tests timing out

Increase timeouts in `playwright.config.ts`:
```typescript
timeout: 60000,  // Test timeout
expect: {
  timeout: 10000,  // Assertion timeout
},
```

### Port conflicts

Ensure port 8080 is not in use:
```bash
lsof -i :8080
```

Or change the port in `docker-compose.yml`.
