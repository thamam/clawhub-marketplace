# Transport: container-build

For standalone containers built and run locally (NanoClaw).

## Deploy Steps

### 1. Build the image
```bash
docker build -t nanoclaw-agent:latest .
```

For a fully clean build (no cache):
```bash
docker builder prune -f
docker build --no-cache -t nanoclaw-agent:latest .
```

### 2. Stop and remove old container
```bash
docker stop nanoclaw-agent && docker rm nanoclaw-agent
```

### 3. Start new container
```bash
docker run -d --name nanoclaw-agent \
  --restart unless-stopped \
  nanoclaw-agent:latest
```

Adjust flags (ports, volumes, env vars) to match the bot's requirements.

### 4. Verify container is running
```bash
docker ps --filter name=nanoclaw-agent --format "table {{.Names}}\t{{.Status}}"
```

### 5. Run test query
```bash
echo '{"query":"hello"}' | docker exec -i nanoclaw-agent node /app/dist/index.js
```

Confirm a valid response is returned. If the container exits or returns an error, check logs.

## BuildKit Cache Gotcha

Docker BuildKit caches intermediate layers aggressively. If you change a file that is `COPY`'d early in the Dockerfile, later layers may still use stale cache. Symptoms:
- Code changes not reflected in the running container
- "Works on my machine" but fails in container

Fix: `docker builder prune -f` before building. This clears all build cache. Use sparingly -- full rebuilds are slower.

## Warnings

- Container runs as root with `HOME=/home/node`. Do not change this -- config paths depend on it.
- If the Dockerfile uses multi-stage builds, ensure the final stage copies all required artifacts. Missing files in the final image are a common issue.
- Check disk space before building: `df -h`. Docker images and build cache can fill disks quickly. Prune unused images periodically: `docker image prune -f`.
