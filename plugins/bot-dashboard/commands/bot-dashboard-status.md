---
name: bot-dashboard-status
description: Check the status of all bots on the UTI telemetry dashboard — shows online/offline state, last seen times, and recent event counts
allowed-tools: Bash(ssh:*), Bash(curl:*), Bash(python3:*)
---

# Dashboard Status Check

Query the UTI telemetry service and report bot fleet status.

## Steps

1. Fetch all bots from the API:
```bash
ssh rog "curl -s http://localhost:3100/api/bots"
```

2. For each bot, compute status based on `last_seen_at`:
   - **Online**: last_seen < 2 minutes ago
   - **Idle**: last_seen < 10 minutes ago
   - **Offline**: last_seen >= 10 minutes ago

3. Fetch recent event counts per bot:
```bash
ssh rog "sqlite3 ~/telemetry-service/telemetry.db \"SELECT b.name, COUNT(e.id) as events_24h FROM bot b LEFT JOIN event e ON b.id = e.bot_id AND e.timestamp > datetime('now', '-24 hours') GROUP BY b.name\""
```

4. Check sidecar service status on each host:
```bash
# ROG sidecars
ssh rog "systemctl --user is-active nook-sidecar 2>/dev/null || echo 'not found'"

# EC2 sidecar
ssh ec2 "systemctl --user is-active uti-telemetry-sidecar 2>/dev/null || echo 'not found'"

# XPS (X is built-in, no separate sidecar)
ssh xps "systemctl --user is-active nanoclaw 2>/dev/null || echo 'not found'"
```

5. Present results as a formatted table showing:
   - Bot name
   - Status (Online/Idle/Offline)
   - Last seen (relative time)
   - Events in last 24h
   - Sidecar status
   - Host

Flag any bots that are running but showing as Offline — this indicates a sidecar or bridge issue.
