# Bot Deploy Profiles

Per-bot defaults for the `/bot-deploy` skill.

| Bot | Transport | Pre-Deploy | Post-Deploy | Critical Notes |
|-----|-----------|------------|-------------|----------------|
| DB | docker-compose | -- | Check gateway logs (`docker logs openclaw-openclaw-gateway-1 --tail 50`) | Always `restart`, never `recreate` unless image changed. `NODE_EXTRA_CA_CERTS` must stay in docker-compose.yml or HTTPS breaks. |
| Nook | rsync | Validate `.rsync-exclude` exists in `docker/` | curl health endpoints: `localhost:8283` (API), `localhost:8081` (tools) | 7-step sequence. **NEVER** rsync without exclude file -- overwrites secrets on remote. |
| Lettabot | railway | `npm run build` + `vitest run` | Railway health check (automatic after deploy) | Uses `railway.toml` for service config. Build must pass locally before pushing. |
| NanoClaw | container-build | -- | Run test query through pipeline (`echo '{"query":"test"}' \| docker exec -i nanoclaw-agent ...`) | `docker builder prune` for clean builds. Container runs as root, `HOME=/home/node`. |
| M-Bot | docker-compose | `uv run ruff check` | Container sandbox health (`docker exec mbot-sandbox echo ok`) | Resource limits: 2 CPU / 4GB RAM. Uses `Dockerfile.sandbox` for isolated execution. |

## Transport Quick Reference

| Transport | Reference File | When to Use |
|-----------|---------------|-------------|
| docker-compose | `transport-docker-compose.md` | Service runs via `docker compose` on a VM |
| rsync | `transport-rsync.md` | Files synced to remote host, services managed separately |
| railway | `transport-railway.md` | Hosted on Railway PaaS |
| container-build | `transport-container-build.md` | Standalone container built and run locally |
