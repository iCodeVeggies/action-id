# Docker Setup Guide

This guide explains how to run the ActionID application using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

## Quick Start

1. **Clone and navigate to the project**:
```bash
cd ActionID
```

2. **Create environment file**:
```bash
cp .env.example .env
```

3. **Start all services**:
```bash
docker-compose up -d
```

4. **Access the application**:
   - Frontend: http://localhost
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/health

## Services

The Docker Compose setup includes three services:

### 1. PostgreSQL Database
- **Image**: `postgres:16-alpine`
- **Port**: 5432 (mapped to host)
- **Volume**: `postgres_data` (persistent storage)
- **Auto-initialization**: Schema is automatically created on first run

### 2. Backend API
- **Build**: Multi-stage build from `backend/Dockerfile`
- **Port**: 3001 (mapped to host)
- **Dependencies**: Waits for PostgreSQL to be healthy
- **Health Check**: `/health` endpoint

### 3. Frontend
- **Build**: Multi-stage build from `frontend/Dockerfile`
- **Port**: 80 (mapped to host)
- **Web Server**: Nginx
- **Proxy**: API requests proxied to backend

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=actionid
DB_USER=postgres
DB_PASSWORD=postgres

# Backend Configuration
BACKEND_PORT=3001
JWT_SECRET=your-secret-key-change-in-production

# Frontend Configuration
FRONTEND_PORT=80
VITE_API_URL=http://localhost:3001/api

# ActionID Configuration
ACTIONID_API_KEY=5000d0dc-9729-4273-b286-01ebb5a8fd7f
ACTIONID_BASE_URL=https://aa-api.a2.ironvest.com
ACTIONID_CLIENT_ID=ivengprod
```

## Docker Commands

### Start Services
```bash
# Start in detached mode
docker-compose up -d

# Start with logs
docker-compose up
```

### Stop Services
```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (clean slate)
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Rebuild Services
```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# Rebuild and restart
docker-compose up -d --build
```

### Access Containers
```bash
# Backend shell
docker-compose exec backend sh

# Database shell
docker-compose exec postgres psql -U postgres -d actionid

# Frontend shell
docker-compose exec frontend sh
```

## Database Management

### View Database
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d actionid

# List tables
\dt

# View users
SELECT * FROM users;
```

### Backup Database
```bash
docker-compose exec postgres pg_dump -U postgres actionid > backup.sql
```

### Restore Database
```bash
docker-compose exec -T postgres psql -U postgres actionid < backup.sql
```

### Reset Database
```bash
# Stop and remove volumes
docker-compose down -v

# Start again (will recreate database)
docker-compose up -d
```

## Development Workflow

### Option 1: Full Docker (Recommended for Demos)
- All services run in Docker
- Use `docker-compose up` to start everything
- Best for consistent environments and demos

### Option 2: Hybrid (Recommended for Development)
- Database in Docker: `docker-compose -f docker-compose.dev.yml up postgres -d`
- Backend and Frontend run locally
- Allows hot-reload and easier debugging

### Option 3: Local Development
- Run PostgreSQL locally or use Docker for DB only
- Run backend: `cd backend && npm run dev`
- Run frontend: `cd frontend && npm run dev`

## Troubleshooting

### Port Already in Use
If ports 80, 3001, or 5432 are already in use:
1. Change ports in `.env` file
2. Update `docker-compose.yml` port mappings
3. Restart services

### Database Connection Issues
```bash
# Check if database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec backend node -e "require('./dist/db/connection.js').default.query('SELECT 1')"
```

### Frontend Not Loading
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Backend Not Starting
```bash
# Check backend logs
docker-compose logs backend

# Check if database is ready
docker-compose ps postgres

# Rebuild backend
docker-compose build backend
docker-compose up -d backend
```

## Production Considerations

For production deployment:

1. **Change default passwords** in `.env`
2. **Use strong JWT_SECRET**
3. **Set proper CORS origins**
4. **Use environment-specific configs**
5. **Enable SSL/TLS** (use reverse proxy like Traefik or Nginx)
6. **Set up database backups**
7. **Use secrets management** (Docker secrets, AWS Secrets Manager, etc.)
8. **Monitor services** (health checks, logging, metrics)

## Docker Images

### Backend Image
- **Base**: `node:20-alpine`
- **Multi-stage**: Build stage compiles TypeScript, production stage runs compiled code
- **Size**: ~150MB (optimized)

### Frontend Image
- **Base**: `nginx:alpine`
- **Multi-stage**: Build stage creates production build, nginx serves static files
- **Size**: ~50MB (optimized)

### Database Image
- **Base**: `postgres:16-alpine`
- **Size**: ~250MB

## Network Architecture

```
Internet
   |
   v
[Frontend:80] (Nginx)
   |
   | /api/* -> Proxy
   v
[Backend:3001] (Node.js/Express)
   |
   | Database queries
   v
[PostgreSQL:5432]
```

All services are on the same Docker network (`actionid-network`) for internal communication.
