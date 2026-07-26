# Deployment Guide

JobMode is designed to be easily deployable using Docker.

## Prerequisites
- Docker Engine and Docker Compose
- A provisioned PostgreSQL database (for production)
- A Redis instance (optional, for rate limiting/caching)

## Docker Compose Setup

A `docker-compose.yml` file is provided in the root directory to spin up the entire stack.

```bash
docker-compose up --build -d
```

This will start:
- The FastAPI backend on port `8000`
- The React frontend on port `80` (via Nginx)

## Production Considerations

### Backend (FastAPI)
- Use **Gunicorn** with **Uvicorn** workers to handle concurrent requests in production.
- Ensure the `DATABASE_URL` points to a persistent PostgreSQL instance, not SQLite.
- Ensure ML models (`.pkl` files) are securely mounted or baked into the Docker image.

### Frontend (React/Vite)
- The frontend should be built statically (`npm run build`) and served via a CDN (e.g., AWS CloudFront, Vercel) or a lightweight web server like Nginx.

### Secrets Management
Do not hardcode secrets. Use a secure secrets manager (AWS Secrets Manager, HashiCorp Vault) and inject them as environment variables into the Docker containers at runtime.
