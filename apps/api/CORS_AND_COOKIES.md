# CORS and Cookie/Session Settings Checklist

This checklist ensures correct CORS handling for browser-based authentication with cookie sessions.

## Backend Configuration (FastAPI)

### 1. CORS Middleware Setup

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Local development
        "http://127.0.0.1:3000",      # Alternative localhost
        "https://yourdomain.com",      # Production domain
    ],
    allow_credentials=True,            # ✅ CRITICAL: Must be True for cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Set-Cookie"],     # Allow browser to see Set-Cookie header
)
```

**Important Notes:**
- ✅ `allow_credentials=True` is required for cookie-based authentication
- ✅ `allow_origins` must list specific origins (cannot use `["*"]` with credentials)
- ✅ Include all frontend URLs (local development + production)
- ✅ Use `allow_origin_regex` if you need pattern matching for multiple hosts

### 2. Cookie Configuration

When setting session cookies, use these flags:

```python
from fastapi import Response

response = Response(content="...")
response.set_cookie(
    key="session_token",
    value=session_token,
    httponly=True,        # ✅ CRITICAL: Prevents JavaScript access (XSS protection)
    secure=True,          # ✅ CRITICAL: HTTPS only (use False only in local dev)
    samesite="lax",       # ✅ CRITICAL: CSRF protection while allowing navigation
    max_age=604800,       # 7 days in seconds
    path="/",             # Cookie sent for all routes
    domain=None,          # Let browser infer domain (or set explicitly for subdomains)
)
```

**Cookie Flags Explained:**

- **HttpOnly=True**
  - Purpose: Prevents JavaScript from accessing the cookie
  - Protection: Defends against XSS attacks
  - ✅ Always set to True for session tokens

- **Secure=True**
  - Purpose: Cookie only sent over HTTPS
  - Protection: Prevents token interception on insecure connections
  - ✅ Set to True in production
  - ⚠️ Set to False for local development (http://localhost)

- **SameSite=Lax**
  - Purpose: Controls when cookies are sent in cross-site requests
  - Options:
    - `Strict`: Cookie never sent on cross-site requests (breaks navigation from external sites)
    - `Lax`: Cookie sent on top-level navigation (GET) but not embedded requests
    - `None`: Cookie sent on all requests (requires Secure=True)
  - ✅ Use `Lax` for most cases (good balance of security and usability)
  - ⚠️ Use `Strict` for high-security applications (may break user flows)

- **Max-Age**
  - Purpose: How long the cookie should persist (in seconds)
  - ✅ Set to session length (e.g., 604800 = 7 days)
  - Use 0 to delete the cookie immediately (logout)

### 3. Environment-Specific Settings

**Local Development:**
```python
import os

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

response.set_cookie(
    key="session_token",
    value=session_token,
    httponly=True,
    secure=(ENVIRONMENT == "production"),  # False in dev, True in prod
    samesite="lax",
    max_age=604800,
    path="/",
)
```

**Production:**
- ✅ Always use `secure=True`
- ✅ Ensure HTTPS is enabled (use Caddy or other reverse proxy)
- ✅ Set correct CORS origins (no `http://localhost`)

## Frontend Configuration

### 1. Fetch API

When using `fetch()`, always include `credentials: 'include'`:

```javascript
fetch('http://localhost:8000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',  // ✅ CRITICAL: Send cookies with request
  body: JSON.stringify({ username, password })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### 2. Axios

When using Axios, set `withCredentials: true`:

```javascript
import axios from 'axios';

axios.post('http://localhost:8000/auth/login', 
  { username, password },
  { withCredentials: true }  // ✅ CRITICAL: Send cookies with request
)
.then(response => console.log(response.data))
.catch(error => console.error('Error:', error));
```

Or configure it globally:

```javascript
axios.defaults.withCredentials = true;
```

### 3. Next.js Considerations

When using Next.js:
- ✅ Client-side requests: Use `credentials: 'include'` or `withCredentials: true`
- ✅ Server-side requests (getServerSideProps): Cookies are not automatically forwarded
- ⚠️ If making API calls from server-side, manually pass cookies from the request headers

## Testing Checklist

### ✅ Pre-flight Requests (OPTIONS)

Test that CORS pre-flight requests work:

```bash
curl -X OPTIONS http://localhost:8000/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v
```

Expected response headers:
- `Access-Control-Allow-Origin: http://localhost:3000`
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Methods: POST, ...`

### ✅ Login Flow

1. User logs in from frontend
2. Server responds with `Set-Cookie` header
3. Browser stores cookie
4. Verify cookie is set in browser DevTools → Application → Cookies

### ✅ Authenticated Requests

1. Make request to authenticated endpoint (e.g., `/games/submit`)
2. Verify cookie is automatically included in request headers
3. Server validates session and responds successfully

### ✅ Logout Flow

1. User logs out
2. Server responds with `Set-Cookie` header with `Max-Age=0`
3. Browser deletes cookie
4. Verify cookie is removed from browser

### ✅ Session Expiry

1. Wait for session to expire (or manually set short expiry for testing)
2. Make request with expired session
3. Server responds with 401 Unauthorized
4. Frontend handles error and redirects to login

## Common Pitfalls and Solutions

### ❌ Problem: CORS error even with middleware configured

**Cause:** `allow_credentials=True` with `allow_origins=["*"]`

**Solution:** Specify exact origins instead of wildcard:
```python
allow_origins=["http://localhost:3000", "https://yourdomain.com"]
```

### ❌ Problem: Cookies not being set in browser

**Cause 1:** Missing `credentials: 'include'` in frontend request

**Solution:** Add to all authenticated requests

**Cause 2:** `Secure=True` with `http://` (non-HTTPS)

**Solution:** Use `Secure=False` in local development or switch to HTTPS

### ❌ Problem: Cookies not sent with requests

**Cause:** Frontend not including credentials

**Solution:** Add `credentials: 'include'` (fetch) or `withCredentials: true` (axios)

### ❌ Problem: Session cleared on logout but cookie remains

**Cause:** Cookie not properly cleared (Max-Age not set to 0)

**Solution:** Ensure logout endpoint sets `Max-Age=0`:
```python
response.set_cookie(
    key="session_token",
    value="",
    max_age=0,  # ✅ Delete cookie
    httponly=True,
    secure=secure_flag,
    samesite="lax",
    path="/",
)
```

### ❌ Problem: Session tampering or token theft

**Cause:** Token not hashed in database or HttpOnly not set

**Solution:**
- ✅ Hash tokens before storing (use SHA-256 or similar)
- ✅ Set `HttpOnly=True` to prevent XSS
- ✅ Use HTTPS in production (`Secure=True`)
- ✅ Implement session expiry

## Files to Update

### Backend (FastAPI)

1. **main.py** or **app.py**
   - Add CORS middleware with correct settings
   - Configure cookie settings in login/logout endpoints

2. **auth.py** or authentication router
   - Implement session creation with proper cookie flags
   - Implement session validation
   - Implement logout with cookie clearing

3. **.env** and **config.py**
   - Store allowed origins
   - Store environment flag (development/production)
   - Store secret key for token generation

### Frontend (Next.js)

1. **API client** or **utils/api.ts**
   - Configure `credentials: 'include'` or `withCredentials: true`
   - Centralize API calls

2. **Authentication components**
   - Handle login/logout flows
   - Handle 401 errors and redirect to login

## Security Best Practices

- ✅ Use HTTPS in production (Caddy auto-generates certificates)
- ✅ Hash session tokens before storing in database
- ✅ Implement session expiry and cleanup
- ✅ Use strong random tokens (at least 128 bits of entropy)
- ✅ Rate limit authentication endpoints to prevent brute force
- ✅ Validate and sanitize all user inputs
- ✅ Log authentication events for auditing
- ❌ Never log session tokens or passwords
- ❌ Never send tokens in URL parameters or response bodies (except Set-Cookie header)
