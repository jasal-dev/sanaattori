# Caddy Deployment Guide

This guide explains how to deploy the Sanaattori application behind Caddy as a reverse proxy with automatic HTTPS.

## Prerequisites

- A VPS or server with:
  - Ubuntu/Debian or similar Linux distribution
  - Public IP address
  - Domain name pointing to the server's IP
- Docker and Docker Compose installed
- Caddy installed (or use Docker)

## Deployment Architecture

```
Internet → Caddy (HTTPS, Port 443) → FastAPI (Port 8000)
                                   → PostgreSQL (Port 5432, internal only)
```

## Step 1: Install Caddy

### Option A: Install Caddy on Host System

```bash
# On Ubuntu/Debian
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### Option B: Use Caddy Docker Container

See "Alternative: All-in-Docker Setup" below.

## Step 2: Configure Domain and Firewall

### DNS Configuration

Point your domain to your server's IP address:

```
A record:    yourdomain.com → YOUR_SERVER_IP
A record:    www.yourdomain.com → YOUR_SERVER_IP (optional)
```

### Firewall Configuration

```bash
# Allow HTTP (for initial cert challenge) and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# SSH (if not already allowed)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

## Step 3: Deploy Application with Docker Compose

1. **Clone the repository:**

```bash
cd /opt
sudo git clone https://github.com/jasal-dev/sanaattori.git
cd sanaattori
```

2. **Create production `.env` file:**

```bash
sudo cp .env.example .env
sudo nano .env
```

Update the following values:
```env
POSTGRES_PASSWORD=<strong-random-password>
SECRET_KEY=<strong-random-secret-key>
ENVIRONMENT=production
```

Generate strong secrets:
```bash
# Generate random password
openssl rand -base64 32

# Generate random secret key
openssl rand -hex 64
```

3. **Update docker-compose.yml for production:**

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: sanaattori-db
    environment:
      POSTGRES_DB: sanaattori
      POSTGRES_USER: sanaattori
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - sanaattori-network
    restart: unless-stopped

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    container_name: sanaattori-api
    environment:
      DATABASE_URL: postgresql://sanaattori:${POSTGRES_PASSWORD}@db:5432/sanaattori
      SECRET_KEY: ${SECRET_KEY}
      ENVIRONMENT: production
    volumes:
      - ./data:/data
    ports:
      - "127.0.0.1:8000:8000"  # Only expose on localhost
    depends_on:
      - db
    networks:
      - sanaattori-network
    restart: unless-stopped
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

volumes:
  postgres_data:

networks:
  sanaattori-network:
    driver: bridge
```

4. **Start the services:**

```bash
sudo docker-compose -f docker-compose.prod.yml up -d
```

5. **Run database migrations:**

```bash
sudo docker-compose -f docker-compose.prod.yml exec api alembic upgrade head
```

## Step 4: Configure Caddy

Create a Caddyfile at `/etc/caddy/Caddyfile`:

```bash
sudo nano /etc/caddy/Caddyfile
```

### Basic Configuration

```caddy
yourdomain.com {
    # Automatic HTTPS
    # Caddy will automatically obtain and renew Let's Encrypt certificates

    # Reverse proxy to FastAPI backend
    reverse_proxy localhost:8000 {
        # Health check
        health_uri /health
        health_interval 30s
        health_timeout 5s
    }

    # Logging
    log {
        output file /var/log/caddy/access.log
        format json
    }

    # Security headers
    header {
        # Remove Server header
        -Server
        
        # Security headers
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
```

### Advanced Configuration (with Frontend)

If you're also serving a Next.js frontend:

```caddy
yourdomain.com {
    # Frontend (Next.js static files or running Next.js server)
    handle /api/* {
        reverse_proxy localhost:8000
    }

    handle {
        # Serve frontend or proxy to Next.js dev server
        reverse_proxy localhost:3000
    }

    # Logging
    log {
        output file /var/log/caddy/access.log
        format json
    }

    # Security headers
    header {
        -Server
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
```

### Reload Caddy Configuration

```bash
sudo caddy reload --config /etc/caddy/Caddyfile
```

Or if using systemd:

```bash
sudo systemctl reload caddy
```

## Step 5: Verify Deployment

1. **Check Caddy status:**

```bash
sudo systemctl status caddy
```

2. **Check application health:**

```bash
curl https://yourdomain.com/health
```

Expected response:
```json
{"status": "ok"}
```

3. **Test HTTPS:**

Visit `https://yourdomain.com` in your browser. You should see a valid SSL certificate from Let's Encrypt.

4. **Check logs:**

```bash
# Caddy logs
sudo tail -f /var/log/caddy/access.log

# Docker logs
sudo docker-compose -f docker-compose.prod.yml logs -f api
```

## Step 6: Update CORS Settings

Update the backend to allow your production domain:

In `apps/api/main.py`, update the CORS origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Local development
        "http://127.0.0.1:3000",
        "https://yourdomain.com",      # Production domain
        "https://www.yourdomain.com",  # Optional: www subdomain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["Set-Cookie"],
)
```

Rebuild and restart:

```bash
sudo docker-compose -f docker-compose.prod.yml up -d --build
```

## Alternative: All-in-Docker Setup

You can also run Caddy in Docker alongside the application:

Add to `docker-compose.prod.yml`:

```yaml
  caddy:
    image: caddy:2-alpine
    container_name: sanaattori-caddy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - sanaattori-network
    restart: unless-stopped

volumes:
  postgres_data:
  caddy_data:
  caddy_config:
```

Then create a `Caddyfile` in the repo root:

```caddy
yourdomain.com {
    reverse_proxy api:8000 {
        health_uri /health
        health_interval 30s
        health_timeout 5s
    }

    log {
        output stdout
        format json
    }
}
```

## Maintenance

### Update Application

```bash
cd /opt/sanaattori
sudo git pull
sudo docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Backup

```bash
# Backup
sudo docker-compose -f docker-compose.prod.yml exec db pg_dump -U sanaattori sanaattori > backup_$(date +%Y%m%d).sql

# Restore
sudo docker-compose -f docker-compose.prod.yml exec -T db psql -U sanaattori sanaattori < backup_20260108.sql
```

### View Logs

```bash
# All services
sudo docker-compose -f docker-compose.prod.yml logs -f

# Specific service
sudo docker-compose -f docker-compose.prod.yml logs -f api
sudo docker-compose -f docker-compose.prod.yml logs -f db

# Caddy (if on host)
sudo journalctl -u caddy -f
```

### Restart Services

```bash
# Restart all
sudo docker-compose -f docker-compose.prod.yml restart

# Restart specific service
sudo docker-compose -f docker-compose.prod.yml restart api
```

## Security Checklist

- ✅ HTTPS enabled (automatic with Caddy)
- ✅ Strong passwords and secret keys in `.env`
- ✅ Database not exposed to public internet (only internal Docker network)
- ✅ API only exposed via Caddy reverse proxy
- ✅ Security headers configured in Caddy
- ✅ Firewall configured (only ports 80, 443, 22 open)
- ✅ Regular backups scheduled
- ✅ CORS configured to allow only your domain
- ✅ Cookies set with Secure, HttpOnly, SameSite flags
- ✅ Session tokens hashed before storage

## Troubleshooting

### Certificate Issues

If Let's Encrypt certificate fails:

1. Verify DNS is properly configured
2. Ensure ports 80 and 443 are accessible
3. Check Caddy logs: `sudo journalctl -u caddy`

### Connection Refused

If you get "connection refused" errors:

1. Verify API is running: `sudo docker-compose -f docker-compose.prod.yml ps`
2. Check if port 8000 is listening: `sudo netstat -tlnp | grep 8000`
3. Test direct connection: `curl http://localhost:8000/health`

### CORS Errors

If you see CORS errors in the browser:

1. Verify your domain is in the `allow_origins` list
2. Ensure `allow_credentials=True` is set
3. Check that frontend is using `credentials: 'include'`

### Database Migration Errors

If migrations fail:

```bash
# Check database connection
sudo docker-compose -f docker-compose.prod.yml exec db psql -U sanaattori -d sanaattori -c "SELECT 1;"

# View migration status
sudo docker-compose -f docker-compose.prod.yml exec api alembic current

# Run migrations
sudo docker-compose -f docker-compose.prod.yml exec api alembic upgrade head
```
