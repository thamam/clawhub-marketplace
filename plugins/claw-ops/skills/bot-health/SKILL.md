---
name: bot-health
description: "Run health checks on any Claw fleet bot. Use when user says 'check bot health', 'is DB running', 'nook status', 'monitor bot', 'health check', or mentions bot uptime, container status, or service health."
---

# Bot Health Check Skill

## Workflow

### 1. Determine Target Bot

Resolve which bot to check:
- Explicit: user says "check DB" or "nook health" -> use that bot name
- Implicit: if running inside a project dir (e.g., `DB_EC2/`), default to that bot
- Ambiguous: ask the user which bot

Normalize the name to match a key in `references/bot-profiles.md` (DB, Nook, NanoClaw, M-Bot, Lettabot).

### 2. Load Bot Profile

Read `references/bot-profiles.md` and extract the row for the target bot. This gives you:
- Host and SSH key (if remote)
- Container name(s)
- Health endpoint
- Extra checks (GPU, backups, watchdog)

### 3. Connect to Host

- **Remote bots (DB, Nook):** SSH into the host. Use the SSH key from the profile.
  ```bash
  ssh -i <SSH_KEY> -o ConnectTimeout=5 -o StrictHostKeyChecking=no <HOST> "<command>"
  ```
- **Local bots (NanoClaw, M-Bot):** Run commands directly on localhost.
- **Platform bots (Lettabot):** Use the platform CLI (e.g., `railway status`).

If SSH fails, report CRITICAL for connectivity and skip remaining checks.

### 4. Execute Health Checks

Run each applicable check from `references/health-checks.md`. Not all checks apply to every bot -- skip checks marked as conditional if the bot profile doesn't have that feature.

Run checks in this order (fast to slow):
1. Container status
2. Disk usage
3. Memory usage
4. Container resource usage
5. Health endpoint
6. Recent error logs
7. GPU status (if applicable)
8. Backup freshness (if applicable)
9. Watchdog status (if applicable)

### 5. Report Results

Output a structured report. Use this format:

```
## Health Report: <BOT_NAME>
Host: <HOST>
Checked: <TIMESTAMP>

| Check           | Status   | Detail                          |
|-----------------|----------|---------------------------------|
| Container       | OK       | Up 3 days, running              |
| Disk            | WARN     | 82% used (16.4G / 20G)         |
| Memory          | OK       | 1.5 GiB / 4.0 GiB (38%)       |
| Health endpoint | OK       | 200 in 45ms                    |
| Error logs      | OK       | 0 errors in last 5 min         |
| GPU             | SKIP     | Not applicable                  |
| Backups         | SKIP     | Not applicable                  |
| Watchdog        | OK       | Last run 3 min ago, no alerts   |

Overall: HEALTHY (1 warning)
```

Severity levels:
- **OK** -- check passed
- **WARN** -- degraded but functional (yellow flag)
- **CRITICAL** -- broken or at risk of failure (red flag, needs action)
- **SKIP** -- check not applicable to this bot

Overall status:
- **HEALTHY** -- all checks OK (warnings are fine)
- **DEGRADED** -- one or more WARN, no CRITICAL
- **UNHEALTHY** -- one or more CRITICAL

If any check is CRITICAL, suggest a remediation action.
