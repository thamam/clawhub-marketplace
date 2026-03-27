# Transport: rsync

For bots where files are synced to a remote host (Nook).

## CRITICAL: Never rsync without .rsync-exclude

The `docker/` directory contains `.env` files, secrets, and host-specific config. Rsyncing without the exclude file **overwrites secrets on the remote host**. Always verify the exclude file exists before syncing.

## 7-Step Deploy Sequence

### 1. Verify .rsync-exclude exists
```bash
if [ ! -f docker/.rsync-exclude ]; then
  echo "ABORT: docker/.rsync-exclude not found"
  exit 1
fi
```

Do not proceed if this file is missing.

### 2. Rsync scripts
```bash
rsync -avz --delete scripts/ <user>@<host>:<remote-path>/scripts/
```

### 3. Rsync tools
```bash
rsync -avz --delete tools/ <user>@<host>:<remote-path>/tools/
```

### 4. Rsync skills
```bash
rsync -avz --delete skills/ <user>@<host>:<remote-path>/skills/
```

### 5. Rsync docker (with exclude)
```bash
rsync -avz --delete --exclude-from='docker/.rsync-exclude' docker/ <user>@<host>:<remote-path>/docker/
```

The `--exclude-from` flag ensures `.env`, secrets, and host-specific files are never overwritten.

### 6. Register tools on remote
```bash
ssh <user>@<host> "cd <remote-path> && ./scripts/register-tools.sh"
```

This registers any new or updated tool definitions with the bot runtime.

### 7. Deploy skills on remote
```bash
ssh <user>@<host> "cd <remote-path> && ./scripts/deploy-skills.sh"
```

### Optional: Restart docker services
Only if docker-compose config changed in step 5:
```bash
ssh <user>@<host> "cd <remote-path>/docker && docker compose restart"
```

## Post-Deploy Verification

```bash
# API health
curl -sf http://<host>:8283/health && echo "API OK" || echo "API FAIL"

# Tools health
curl -sf http://<host>:8081/health && echo "Tools OK" || echo "Tools FAIL"
```

## Common Mistakes

- Forgetting `--exclude-from` on the docker rsync step -- destroys remote secrets
- Rsyncing from the wrong local directory (check `pwd` before each rsync)
- Skipping tool registration after syncing new tools -- bot won't see them
