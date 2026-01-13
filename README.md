# Sanaattori

Collection of Finnish word games built with Next.js and FastAPI.

## Project Structure

- `apps/landing` - Landing page for game selection (Next.js)
- `apps/games/sanasto` - Sanasto word game (Next.js frontend with TypeScript + Tailwind CSS)
- `apps/api` - FastAPI backend
- `data/` - Word lists (raw and processed)
- `scripts/` - Build scripts for word list generation

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.8+
- npm or yarn

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

   **Note for ARM64/Apple Silicon users:** If you encounter errors related to `lightningcss` native modules, run `npm install` again after the initial install. The platform-specific native modules will be installed automatically based on your system architecture.

2. Set up Python virtual environment for API:
   ```bash
   cd apps/api
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

### Running the Application

Start all services:
```bash
npm run dev
```

This will start:
- Landing page: http://localhost:3001
- Sanasto game: http://localhost:3002
- Backend: http://localhost:8000

### Individual Services

Landing page only:
```bash
npm run dev:landing
```

Sanasto game only:
```bash
npm run dev:sanasto
```

Backend only:
```bash
npm run dev:api
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Docker Setup

### Using Docker Compose (Recommended for Development)

1. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your configuration (especially change `POSTGRES_PASSWORD` and `SECRET_KEY` for production).

3. Start all services:
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database on port 5432 (internal)
   - FastAPI backend (internal)
   - Landing page (internal)
   - Sanasto game (internal)
   - Nginx reverse proxy on http://localhost:8080

   The application is accessible at:
   - Main site: http://localhost:8080
   - Sanasto game: http://localhost:8080/sanasto
   - API: http://localhost:8080/api

4. View logs:
   ```bash
   docker-compose logs -f
   
   # Or for a specific service
   docker-compose logs -f landing
   docker-compose logs -f sanasto
   docker-compose logs -f api
   docker-compose logs -f nginx
   ```

5. Stop the services:
   ```bash
   docker-compose down
   ```

6. Stop and remove volumes (⚠️ this will delete all data):
   ```bash
   docker-compose down -v
   ```

### Updating After Git Pull

When you pull new code changes, Docker needs to rebuild to pick up the changes:

```bash
# 1. Stop containers
docker-compose down

# 2. Pull latest changes
git pull

# 3. Rebuild containers (important!)
docker-compose build --no-cache

# 4. Start containers
docker-compose up -d
```

**Quick restart** (only if no new dependencies or files were added):
```bash
docker-compose restart
```

For more details, see [DEPLOYMENT.md](./DEPLOYMENT.md#updating-the-application).

### Running Tests in Docker

```bash
# Backend tests
docker-compose exec api pytest

# Sanasto game tests
docker-compose exec sanasto npm test
```

## License

See individual component licenses in respective directories.
