# Health Check Definitions

Each check has a command, parse logic, and thresholds. Run on the target host (via SSH for remote, directly for local).

---

## 1. Container Status

Check that all expected containers are running.

```bash
docker ps --filter "name=<CONTAINER>" --format '{{.Names}}\t{{.Status}}\t{{.State}}'
```

- **OK:** State is `running`
- **CRITICAL:** Container not found, or state is `exited` / `restarting` / `dead`
- **WARN:** Status contains `Restarting` or uptime < 5 minutes (recent restart)

If container is not running, report CRITICAL and skip container-dependent checks (resource usage, logs, health endpoint).

---

## 2. Disk Usage

```bash
df -h / | awk 'NR==2 {print $5, $3, $2}'
```

Output: `82% 16.4G 20G`

- **OK:** < 80%
- **WARN:** 80-90%
- **CRITICAL:** > 90%

Also check Docker-specific disk usage:

```bash
docker system df --format '{{.Type}}\t{{.Size}}\t{{.Reclaimable}}'
```

Report reclaimable space if > 5GB (suggests `docker system prune` is needed).

---

## 3. Memory Usage

```bash
free -m | awk 'NR==2 {printf "%d %d %.1f\n", $3, $2, $3/$2*100}'
```

Output: `1540 3932 39.2` (used_mb total_mb percent)

- **OK:** < 80%
- **WARN:** 80-90%
- **CRITICAL:** > 90%

---

## 4. Container Resource Usage

```bash
docker stats --no-stream --format '{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}' <CONTAINER>
```

Report CPU% and memory usage. No hard thresholds -- informational, but flag if:
- **WARN:** CPU > 80% sustained or memory > 80% of container limit
- **CRITICAL:** Memory > 90% of limit (OOM kill risk)

---

## 5. Health Endpoint

For HTTP endpoints:
```bash
curl -sf -o /dev/null -w '%{http_code} %{time_total}' --max-time 5 <HEALTH_ENDPOINT>
```

For WebSocket endpoints (like DB's `ws://localhost:18789`):
```bash
curl -sf -o /dev/null -w '%{http_code} %{time_total}' --max-time 5 http://localhost:18789
```
(WebSocket endpoints typically respond to HTTP with an upgrade or status page.)

- **OK:** HTTP 200 (or 101 for WS upgrade) and response time < 2s
- **WARN:** Response time > 2s but < 5s
- **CRITICAL:** Non-200 status, timeout, or connection refused

For platform bots without a direct endpoint, skip this check.

---

## 6. Recent Error Logs

```bash
docker logs --since 5m <CONTAINER> 2>&1 | grep -ci 'error\|fatal\|crash\|exception\|ECONNREFUSED\|OOM'
```

- **OK:** 0 matches
- **WARN:** 1-5 matches
- **CRITICAL:** > 5 matches

If WARN or CRITICAL, also grab the actual error lines for context:
```bash
docker logs --since 5m <CONTAINER> 2>&1 | grep -i 'error\|fatal\|crash\|exception' | tail -5
```

---

## 7. GPU Status (conditional -- only if bot profile has `GPU: yes`)

```bash
nvidia-smi --query-gpu=name,utilization.gpu,utilization.memory,memory.used,memory.total,temperature.gpu --format=csv,noheader,nounits
```

Output: `NVIDIA GeForce RTX 3090, 45, 62, 14800, 24576, 65`

- **OK:** Temperature < 80C, memory < 90%
- **WARN:** Temperature 80-90C or memory 90-95%
- **CRITICAL:** Temperature > 90C or memory > 95%

If `nvidia-smi` is not found, report SKIP (driver not installed).

---

## 8. Backup Freshness (conditional -- only if bot profile has `Backups` entry)

For PostgreSQL dumps:
```bash
find /path/to/backups -name '*.sql*' -mmin -1440 | wc -l
```

For volume backups:
```bash
ls -lt /path/to/backups/ | head -2
```

- **OK:** Backup file exists and is < 24 hours old
- **WARN:** Backup is 24-48 hours old
- **CRITICAL:** No backup in 48+ hours or backup directory missing

Adapt paths based on the bot profile.

---

## 9. Watchdog Status (conditional -- only for bots with a watchdog)

For DB's watchdog:
```bash
tail -5 /var/log/openclaw-watchdog.log
```

Check the last entry timestamp and content:
- **OK:** Last run within 10 minutes, no alerts
- **WARN:** Last run > 10 minutes ago (cron may have stopped)
- **CRITICAL:** Log contains "KILLING" or "PERMANENT STOP" entries in last hour

Also verify the cron entry exists:
```bash
sudo crontab -l 2>/dev/null | grep -c watchdog
```

- **OK:** 1 (cron entry present)
- **CRITICAL:** 0 (watchdog cron missing)

---

## 10. Service-Specific Checks

For **Lettabot** (Railway):
```bash
railway status
```

For **NanoClaw** (launchd):
```bash
launchctl list | grep nanoclaw
```
- **OK:** PID present (service running)
- **CRITICAL:** No PID or `-` in PID column (service stopped)

For **M-Bot** (resource limits):
```bash
docker inspect <CONTAINER> --format '{{.HostConfig.NanoCpus}} {{.HostConfig.Memory}}'
```
Verify limits match expected (2 CPU = 2000000000 NanoCpus, 4GB = 4294967296 bytes).
