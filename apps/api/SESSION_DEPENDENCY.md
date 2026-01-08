# Session Management Dependency Note

## Overview

The session management implementation (#35) has a critical dependency on the sessions table in the database schema (#41).

## Dependency Chain

```
#34: Database schema (users and game_results tables)
  ↓
#41: Sessions table added to database schema
  ↓
#35: Session management implementation (FastAPI endpoints and logic)
```

## Implementation Order

**REQUIRED ORDER:**

1. **First:** Implement #34 and #41 (Database schema including sessions table)
   - Create users table
   - Create game_results table  
   - Create sessions table
   - Run Alembic migrations

2. **Second:** Implement #35 (Session management)
   - Implement login endpoint (creates session)
   - Implement logout endpoint (deletes session)
   - Implement session validation middleware
   - Configure secure cookie settings

## Why This Order Matters

The session management code (#35) requires the sessions table (#41) to:
- Store session tokens (hashed)
- Track session expiry times
- Associate sessions with users
- Enable session cleanup

Attempting to implement session management without the sessions table will result in:
- Database errors when trying to create/read/delete sessions
- Failed authentication flows
- Migration conflicts

## Database Schema Requirements

The sessions table must include:
- `id`: Primary key
- `user_id`: Foreign key to users table
- `token_hash`: Hashed session token (indexed for lookup)
- `created_at`: Session creation timestamp
- `expires_at`: Session expiry timestamp (indexed for cleanup)

See `apps/api/alembic/versions/*_initial_schema_*.py` for the full migration.

## Implementation Status

- [x] #34: Database schema for users and game_results
- [x] #41: Sessions table added to database schema
- [ ] #35: Session management implementation

## Notes for Developers

- The Alembic migration creates all three tables in a single migration
- Sessions table includes foreign key constraint to users table
- Indexes are created for efficient session lookup and expiry cleanup
- Make sure to run `alembic upgrade head` before testing session management
