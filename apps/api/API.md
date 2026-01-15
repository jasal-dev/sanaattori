# API Documentation

This document defines the API contracts for the Sanaattori backend.

> **OpenAPI Specification**: For a complete, machine-readable API specification, see [openapi.yaml](./openapi.yaml).
> This file can be used with tools like Swagger UI, Postman, or API client generators.

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request:**
```json
{
  "username": "player123",
  "password": "securePassword123"
}
```

**Response (Success - 201 Created):**
```json
{
  "id": 1,
  "username": "player123",
  "created_at": "2026-01-08T15:00:00Z"
}
```

**Response (Duplicate Username - 409 Conflict):**
```json
{
  "detail": "Username already exists"
}
```

**Response (Invalid Input - 422 Unprocessable Entity):**
```json
{
  "detail": [
    {
      "loc": ["body", "username"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**Notes:**
- Passwords are hashed using argon2id before storage
- Username must be unique (case-sensitive)
- No email required
- Minimum username length: 3 characters
- Minimum password length: 8 characters

---

### POST /auth/login

Authenticate and create a session.

**Request:**
```json
{
  "username": "player123",
  "password": "securePassword123"
}
```

**Response (Success - 200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "player123"
  }
}
```

**Set-Cookie Header:**
```
session_token=<random-token>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/
```

**Response (Invalid Credentials - 401 Unauthorized):**
```json
{
  "detail": "Invalid username or password"
}
```

**Notes:**
- Session cookie is set with HttpOnly, Secure, and SameSite=Lax flags
- Session token is hashed before storage in database
- Session expires after 7 days (604800 seconds)
- The actual token value is random and cryptographically secure

---

### POST /auth/logout

End the current session.

**Request:**
No body required. Session token provided via cookie.

**Response (Success - 200 OK):**
```json
{
  "message": "Logout successful"
}
```

**Set-Cookie Header (clears cookie):**
```
session_token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/
```

**Response (Unauthenticated - 401 Unauthorized):**
```json
{
  "detail": "Not authenticated"
}
```

**Notes:**
- Deletes the session from the database
- Clears the session cookie by setting Max-Age=0

---

### GET /auth/me

Get the current authenticated user's profile information.

**Request:**
No body required. Session token provided via cookie.

**Response (Success - 200 OK):**
```json
{
  "id": 1,
  "username": "player123",
  "created_at": "2026-01-08T15:00:00Z"
}
```

**Response (Unauthenticated - 401 Unauthorized):**
```json
{
  "detail": "Not authenticated"
}
```

**Notes:**
- Requires valid session cookie
- Returns basic user profile information

---

## Game Endpoints

### POST /games/submit

Submit a game result (requires authentication).

**Request:**
```json
{
  "score": 100
}
```

**Response (Success - 201 Created):**
```json
{
  "id": 42,
  "user_id": 1,
  "score": 100,
  "played_at": "2026-01-08T15:30:00Z"
}
```

**Response (Unauthenticated - 401 Unauthorized):**
```json
{
  "detail": "Not authenticated"
}
```

**Notes:**
- Only authenticated users can submit scores
- `played_at` is automatically set to current timestamp
- Score must be a non-negative integer (0 or greater)
- Score interpretation: 1-6 = win (won in that many guesses), 0 or >6 = loss
- No client-side validation of score authenticity (see Score Payload Documentation)

---

### GET /stats/me

Get statistics for the current authenticated user.

**Request:**
No body required. Session token provided via cookie.

**Response (Success - 200 OK):**
```json
{
  "played": 42,
  "won": 35,
  "lost": 7,
  "winRate": 83.33,
  "currentStreak": 5,
  "maxStreak": 12
}
```

**Response (Unauthenticated - 401 Unauthorized):**
```json
{
  "detail": "Not authenticated"
}
```

**Notes:**
- Requires valid session cookie
- Statistics are calculated from the user's game results
- Win/loss determination:
  - Score 1-6: Win (won in that many guesses)
  - Score 0 or > 6: Loss
- `winRate`: Percentage of games won (0-100)
- `currentStreak`: Current consecutive wins
- `maxStreak`: Maximum consecutive wins achieved

---

### GET /games/me

Get game history for the current authenticated user.

**Query Parameters:**
- `page` (optional, default: 1): Page number for pagination
- `per_page` (optional, default: 20, max: 100): Results per page

**Request Example:**
```
GET /games/me?page=1&per_page=20
```

**Response (Success - 200 OK):**
```json
{
  "games": [
    {
      "id": 42,
      "user_id": 1,
      "score": 3,
      "played_at": "2026-01-13T15:30:00Z"
    },
    {
      "id": 41,
      "user_id": 1,
      "score": 5,
      "played_at": "2026-01-13T14:15:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "per_page": 20
}
```

**Response (Unauthenticated - 401 Unauthorized):**
```json
{
  "detail": "Not authenticated"
}
```

**Notes:**
- Requires valid session cookie
- Returns paginated list of all game results for the logged-in user
- Results are ordered by `played_at` (most recent first)
- `total`: Total number of games played by the user
- `page`: Current page number
- `per_page`: Number of results per page

---

## Leaderboard Endpoints

### GET /leaderboard/weekly

Get the weekly leaderboard (top players in the last 7 days).

**Query Parameters:**
- `limit` (optional, default: 10, max: 100): Number of top players to return

**Request Example:**
```
GET /leaderboard/weekly?limit=10
```

**Response (Success - 200 OK):**
```json
{
  "period": "weekly",
  "start_date": "2026-01-01T00:00:00Z",
  "end_date": "2026-01-08T15:30:00Z",
  "leaderboard": [
    {
      "rank": 1,
      "username": "player123",
      "total_score": 1500,
      "games_played": 15
    },
    {
      "rank": 2,
      "username": "player456",
      "total_score": 1200,
      "games_played": 12
    }
  ]
}
```

**Notes:**
- Weekly window is last 7 days from current time
- Players are ranked by total score (sum of all scores in the period)
- Ties are broken by fewer games played (better average)

---

### GET /leaderboard/alltime

Get the all-time leaderboard.

**Query Parameters:**
- `limit` (optional, default: 10, max: 100): Number of top players to return

**Request Example:**
```
GET /leaderboard/alltime?limit=10
```

**Response (Success - 200 OK):**
```json
{
  "period": "all-time",
  "leaderboard": [
    {
      "rank": 1,
      "username": "player123",
      "total_score": 15000,
      "games_played": 150
    },
    {
      "rank": 2,
      "username": "player456",
      "total_score": 12000,
      "games_played": 120
    }
  ]
}
```

**Notes:**
- Includes all game results since account creation
- Players are ranked by total score (sum of all scores)
- Ties are broken by fewer games played (better average)

---

## Session Management

### Session Cookie Details

**Cookie Name:** `session_token`

**Cookie Flags:**
- `HttpOnly`: Yes (prevents JavaScript access, XSS protection)
- `Secure`: Yes (requires HTTPS in production)
- `SameSite`: Lax (prevents CSRF while allowing navigation)
- `Max-Age`: 604800 seconds (7 days)
- `Path`: / (cookie sent for all routes)

**Session Flow:**
1. User logs in → Server generates random token and creates session record
2. Token is hashed (SHA-256) and stored in database with user_id and expiry
3. Original token is sent to client as HttpOnly cookie
4. Client includes cookie in subsequent requests automatically
5. Server validates token by hashing and looking up in sessions table
6. Expired sessions are rejected (and cleaned up)

**Session Tampering Protection:**
- Tokens are cryptographically random (128 bits of entropy)
- Only hash is stored in database (token cannot be recovered if DB is compromised)
- Session includes expiry time checked on every request

---

## CORS Configuration

The backend is configured to accept requests from the frontend origin with credentials.

**Allowed Origins:**
- Development: `http://localhost:3000`, `http://127.0.0.1:3000`
- Production: `https://yourdomain.com` (configure as needed)

**CORS Headers:**
- `Access-Control-Allow-Credentials`: true
- `Access-Control-Allow-Origin`: (matches request origin if allowed)
- `Access-Control-Allow-Methods`: GET, POST, PUT, DELETE, OPTIONS
- `Access-Control-Allow-Headers`: Content-Type, Authorization

**Frontend Requirements:**
When making requests from the frontend, include credentials:

```javascript
// Using fetch
fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important: Include cookies
  body: JSON.stringify({ username, password })
})

// Using axios
axios.post('http://localhost:8000/auth/login', 
  { username, password },
  { withCredentials: true } // Important: Include cookies
)
```

---

## Error Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request format
- **401 Unauthorized**: Authentication required or failed
- **409 Conflict**: Resource already exists (e.g., duplicate username)
- **422 Unprocessable Entity**: Validation error
- **500 Internal Server Error**: Server error
