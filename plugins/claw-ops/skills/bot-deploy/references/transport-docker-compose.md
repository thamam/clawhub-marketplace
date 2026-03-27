# Transport: docker-compose

For bots running via `docker compose` on a VM (DB, M-Bot).

## When to Restart vs Recreate

- **`docker compose restart <service>`** -- Use when only config files or workspace files changed. Keeps the same container and image. Fast (~2s).
- **`docker compose up -d <service>`** -- Use when the image changed (new build), env vars changed in `docker-compose.yml`, or volume mounts changed. Creates a new container from the updated image/config.

Rule: if you ran `docker build`, you must `up -d`. If you only edited files on the host, `restart` is enough.

## Deploy Steps

### 1. SSH to host
```bash
ssh -i <key> <user>@<host>
```

### 2. Pull or build image (if image changed)
```bash
cd ~/openclaw
docker build -t openclaw:local -f Dockerfile .
```

For M-Bot with sandbox:
```bash
docker build -t mbot:local -f Dockerfile.sandbox .
```

Build args (DB-specific):
```bash
docker build --build-arg OPENCLAW_INSTALL_BROWSER=1 -t openclaw:local -f Dockerfile .
```

### 3. Deploy
If image changed:
```bash
docker compose up -d <service>
```

If only config/files changed:
```bash
docker compose restart <service>
```

### 4. Verify container is running
```bash
docker ps --filter name=<container-name> --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### 5. Check logs for errors
```bash
docker logs <container-name> --tail 50
```

Look for:
- `ws://0.0.0.0:18789` (gateway started)
- Channel connection confirmations
- No `Error` or `FATAL` lines

## Warnings

- **NODE_EXTRA_CA_CERTS**: Must remain in `docker-compose.yml` environment. Without it, all HTTPS requests from Node.js inside the container fail with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`. Never remove this line.
- **Volume mounts**: If you change volume mounts in `docker-compose.yml`, you must `up -d` (not `restart`). A restart reuses the old container definition.
- **Sessions**: After significant changes, consider clearing sessions: `rm ~/.openclaw/agents/main/sessions/sessions.json` before restarting, so the bot re-reads updated workspace files.
