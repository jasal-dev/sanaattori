#!/bin/bash
# E2E Test Runner - Runs tests against Docker containers

set -e

echo "🚀 Starting E2E tests against Docker containers..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
  echo -e "${YELLOW}🧹 Cleaning up Docker containers...${NC}"
  docker compose down
}

# Register cleanup function
trap cleanup EXIT

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Error: Docker is not running${NC}"
  exit 1
fi

echo "📦 Building Docker containers..."
docker compose build

echo "🐳 Starting Docker containers..."
docker compose up -d

echo "⏳ Waiting for services to be healthy..."
# Wait for nginx to be ready
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Services are ready${NC}"
    break
  fi
  attempt=$((attempt + 1))
  echo "Waiting... (attempt $attempt/$max_attempts)"
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo -e "${RED}❌ Services failed to start${NC}"
  docker compose logs
  exit 1
fi

# Give services a bit more time to fully initialize
sleep 3

echo "🎭 Running Playwright tests..."
cd e2e-tests
npm install
npx playwright install chromium
npm test

echo -e "${GREEN}✅ All tests passed!${NC}"
