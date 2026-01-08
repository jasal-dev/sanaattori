# Sanaattori

Finnish Wordle-style word game built with Next.js and FastAPI.

## Project Structure

- `apps/web` - Next.js frontend (TypeScript + Tailwind CSS)
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

Start both frontend and backend:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### Individual Services

Frontend only:
```bash
npm run dev:web
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

3. Start the services:
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database on port 5432
   - FastAPI backend on http://localhost:8000

4. View logs:
   ```bash
   docker-compose logs -f
   ```

5. Stop the services:
   ```bash
   docker-compose down
   ```

6. Stop and remove volumes (⚠️ this will delete all data):
   ```bash
   docker-compose down -v
   ```

### Running Tests in Docker

```bash
docker-compose exec api pytest
```

## License

See individual component licenses in respective directories.
