# Bot Profiles

Per-bot connection details and check configuration. Used by the health check workflow to determine how to connect and what to check.

| Bot | Host | SSH Key | Container(s) | Health Endpoint | Extras |
|-----|------|---------|---------------|-----------------|--------|
| DB | `ubuntu@100.25.48.105` | `~/.ssh/aws/open-claw-key.pem` | `openclaw-openclaw-gateway-1` | `ws://localhost:18789` | Watchdog: `/var/log/openclaw-watchdog.log` |
| Nook | `tomer@192.168.68.65` | default SSH | `letta-server`, `ollama`, `cadvisor` | `http://localhost:8283/v1/health/` | GPU: yes, Backups: PG + data volumes |
| NanoClaw | localhost | -- | `nanoclaw-agent` | -- | launchd service, `HOME=/home/node` |
| M-Bot | localhost | -- | sandbox container | -- | Resource limits: 2 CPU / 4GB RAM |
| Lettabot | Railway | -- | -- | Railway health check | Use `railway status` |

---

## Profile Details

### DB

- **Type:** Remote (AWS EC2)
- **SSH:** `ssh -i ~/.ssh/aws/open-claw-key.pem ubuntu@100.25.48.105`
- **Containers:** `openclaw-openclaw-gateway-1`
- **Health endpoint:** `ws://localhost:18789` (test via HTTP -- gateway responds on same port)
- **Watchdog:** Root crontab runs `/home/ubuntu/openclaw-watchdog.sh` every 5 min. Log at `/var/log/openclaw-watchdog.log`.
- **Applicable checks:** Container, Disk, Memory, Resources, Health endpoint, Error logs, Watchdog
- **Known normals:** WhatsApp 503/428 disconnects are provider-side and self-heal in 2-5s. Do not flag as errors.

### Nook

- **Type:** Remote (local network)
- **SSH:** `ssh tomer@192.168.68.65` (default SSH key)
- **Containers:** `letta-server` (main), `ollama` (LLM inference), `cadvisor` (monitoring)
- **Health endpoint:** `http://localhost:8283/v1/health/`
- **GPU:** NVIDIA GPU present -- run `nvidia-smi` checks
- **Backups:** PostgreSQL dumps + data volume backups
- **Applicable checks:** Container (x3), Disk, Memory, Resources, Health endpoint, Error logs, GPU, Backups

### NanoClaw

- **Type:** Local (this machine)
- **Containers:** `nanoclaw-agent`
- **Service manager:** launchd (macOS) -- check via `launchctl list | grep nanoclaw`
- **Applicable checks:** Container, Disk, Memory, Resources, Error logs, launchd status

### M-Bot

- **Type:** Local (this machine)
- **Containers:** sandbox container (name varies)
- **Resource limits:** 2 CPU / 4GB RAM -- verify with `docker inspect`
- **Applicable checks:** Container, Disk, Memory, Resources, Error logs, Resource limit verification

### Lettabot

- **Type:** Platform (Railway)
- **No SSH access.** Use `railway status` CLI.
- **Health check:** Railway built-in health check
- **Applicable checks:** Railway status, Error logs (via `railway logs`)
