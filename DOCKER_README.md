# Docker Deployment Guide

This guide shows how to run the Temporal Game Demo using Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

1. **Clone the repository and navigate to the project directory**

2. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your credentials:
   ```env
   SECRET_KEY=your_secret_key_here
   ```

3. **Build and start all services**
   ```bash
   docker compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Temporal Tagger: http://localhost:8000

## Services Overview

### 🎯 Frontend (Next.js)
- **Port**: 3000
- **Container**: `temporal-game-frontend`
- **Description**: React-based web interface for the temporal game

### 🚀 Backend (Flask)
- **Port**: 5000
- **Container**: `temporal-game-backend`
- **Description**: Python Flask API serving game logic and endpoints

### 🏷️ Temporal Tagger
- **Port**: 8000
- **Container**: `temporal-tagger`
- **Description**: Pre-built Docker image for temporal entity tagging

## Development Mode

For development with hot reloading:

```bash
# Start only the temporal tagger
docker compose up temporal-tagger -d

# Run backend locally
poetry install
poetry run python app.py

# Run frontend locally (in another terminal)
cd frontend
npm install
npm run dev
```

## Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start services in background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Rebuild a specific service
docker-compose up --build backend

# Remove all containers, networks, and volumes
docker-compose down -v --remove-orphans
```

## Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check if ports are in use
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :5000
   netstat -tulpn | grep :8000
   ```

2. **Permission errors**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

3. **Container build failures**
   ```bash
   # Clean Docker cache
   docker system prune -a
   docker-compose build --no-cache
   ```

4. **Network connectivity issues**
   ```bash
   # Check container network
   docker network ls
   docker network inspect temporal_game_demo_temporal-network
   ```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HF_USERNAME` | Hugging Face username | - |
| `HF_TOKEN` | Hugging Face token | - |
| `SECRET_KEY` | Flask secret key | `temporal_game_secret` |
| `FLASK_ENV` | Flask environment | `development` |
| `NODE_ENV` | Node.js environment | `production` |

### Health Checks

- Backend health: `curl http://localhost:5000/api/health`
- Temporal tagger test: `curl -X POST http://localhost:8000/annotate -H "Content-Type: application/json" -d '{"text": "I have a meeting tomorrow."}'`

### Logs

View application logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f temporal-tagger
```

## Production Deployment

For production deployment:

1. **Use production environment variables**
2. **Configure reverse proxy (nginx/apache)**
3. **Set up SSL certificates**
4. **Configure monitoring and logging**
5. **Set up backup strategies**

Example nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │ Temporal Tagger │
│   (Next.js)     │◄──►│    (Flask)      │◄──►│   (Docker)      │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘

Network: temporal-network (bridge)
``` 