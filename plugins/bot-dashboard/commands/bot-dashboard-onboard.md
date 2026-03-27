---
name: bot-dashboard-onboard
description: >
  Onboard a bot to the UTI telemetry dashboard. Use when a bot needs to be registered,
  when a bot shows as "Offline" but is running, when setting up telemetry for a new bot,
  or when creating a sidecar bridge to connect a bot's native telemetry to UTI format.
  Covers: registration, telemetry mapping, sidecar deployment, and verification.
argument-hint: [bot-name]
tags: [telemetry, dashboard, onboarding, sidecar, monitoring]
---

# Bot Dashboard Onboarding

You are onboarding a bot to the UTI (Unified Telemetry Interface) dashboard. This is a multi-step process that requires understanding what the bot already produces, mapping it to UTI's event contract, deploying a sidecar, and verifying end-to-end connectivity.

## Before You Start — Read These Files

Read these files to understand the current state. DO NOT skip this step.

1. **Infrastructure inventory** — run `chub get neuronbox/nanoclaw-infrastructure --lang js` for machine IPs, Tailscale addresses, service ports, and credential locations
2. **UTI telemetry spec** — read `openspec/specs/unified-telemetry/spec.md` in the X-nanoclaw repo for the formal contract
3. **Bot observation spec** — read `openspec/specs/bot-observation/spec.md` for how the dashboard consumes telemetry
4. **Bot onboarding guide** — read `docs/bot-onboarding-guide.md` if it exists
5. **Existing sidecar** — run `ssh rog "cat ~/nook-sidecar/src/main.py"` to see the reference implementation
6. **Bot anatomy file** — read `bot-anatomy/<BOT_NAME>.md` for the target bot's architecture

## Phase 1: Registration

### Check if bot is already registered

```bash
# Query the telemetry API for existing bots
ssh rog "curl -s http://localhost:3100/api/bots" | python3 -m json.tool
```

If the bot appears in the list, skip to Phase 2. Note its `bot_id` and retrieve its registration token:

```bash
ssh rog "sqlite3 ~/telemetry-service/telemetry.db \"SELECT id, name, registration_token FROM bot WHERE name = '<BOT_NAME>'\""
```

### Register a new bot

If the bot is NOT registered, use the onboard script from the X-nanoclaw repo:

```bash
cd <X-nanoclaw repo>
ADMIN_API_KEY=b88c98bb89a2a6e10883d0869d1d22948ce51fe26e7228333af7836b46baab9b \
  npm run onboard -- \
    --name "<BotName>" \
    --ssh-target "<user@host-or-alias>" \
    --container "<docker-container-name>" \
    --framework "<framework-name>" \
    --github-issues-repo "neuron-box/<bot>-issues" \
    --github-source-repo "<org>/<repo>" \
    --local-project-dir "<path>"
```

Or register via API directly:

```bash
curl -X POST http://100.99.148.99:3100/api/register \
  -H "Authorization: Bearer b88c98bb89a2a6e10883d0869d1d22948ce51fe26e7228333af7836b46baab9b" \
  -H "Content-Type: application/json" \
  -d '{"name": "<BotName>", "config": { ... }}'
```

Save the returned `bot_id` and `registration_token` — you need both for the sidecar.

## Phase 2: Telemetry Discovery

Investigate what telemetry the bot ALREADY produces. Do NOT assume — discover.

### What to look for

Run these discovery steps against the bot's project directory and running container:

```bash
# 1. Check for structured log files (JSONL, JSON, structured logs)
find <project-dir> -name "*.jsonl" -o -name "*.log" -o -name "telemetry*" | head -20
docker exec <container> find / -name "*.jsonl" -o -name "*.log" -o -name "telemetry*" 2>/dev/null | head -20

# 2. Check for telemetry databases (SQLite is common)
find <project-dir> -name "*.db" -o -name "*.sqlite" | head -20
docker exec <container> find / -name "*.db" -o -name "*.sqlite" 2>/dev/null | head -20

# 3. Look for event bus / pub-sub systems
grep -rl "EventBus\|event_type\|EventType\|pubsub\|emit\|on_event" <project-dir> --include="*.py" --include="*.ts" --include="*.js" | head -20

# 4. Check Docker logs format
docker logs <container> --tail 20

# 5. Look for existing health endpoints
docker exec <container> curl -s http://localhost:8080/health 2>/dev/null || echo "No health endpoint"

# 6. Check Docker compose for volume mounts (where logs go)
cat <project-dir>/docker-compose*.yml
```

### Map discoveries to UTI event types

The UTI ingest endpoint accepts these event types. For each one, identify the bot's equivalent output:

| UTI Event Type | Required Payload | What to look for in the bot |
|---|---|---|
| `heartbeat` | `uptime_seconds` | Health endpoints, periodic status logs, process uptime |
| `message` | `channel`, `direction` ("inbound"/"outbound") | Channel adapters, message handlers, chat logs |
| `token_usage` | `model`, `input_tokens`, `output_tokens` | LLM call wrappers, inference telemetry, cost tracking |
| `error` | `message`, `severity` ("error"/"fatal"/"panic") | Error handlers, exception logs, crash reports |
| `tool_call` | `tool`, `status` ("success"/"error"/"timeout"), `duration_ms` | Tool registries, function call logs, MCP tool traces |
| `lifecycle` | `action` ("start"/"stop"/"crash"/"restart"/"oom_kill") | Docker events on the container (sidecar handles this) |
| `config_change` | `file`, `change_source` | Config files that change at runtime (sidecar handles this) |
| `startup` | `version`, `config_hash` | Boot logs, initialization output |

### Event envelope format

Every event forwarded to UTI must have this envelope:

```json
{
  "timestamp": "2026-03-22T19:00:00.000Z",
  "bot_id": "<uuid>",
  "event_type": "heartbeat",
  "payload": { "uptime_seconds": 3600 }
}
```

**Critical**: `bot_id` in the payload MUST match the bot authenticated by the registration token. Mismatch = 403.

## Phase 3: Build the Telemetry Bridge

The bridge translates the bot's native telemetry into UTI JSONL format. The standard sidecar then tails this file and forwards events to the telemetry service.

### Architecture

```
Bot (native telemetry) → Bridge (translates to UTI JSONL) → Sidecar (forwards to API)
```

The bridge is bot-specific. The sidecar is framework-agnostic and reusable.

### Bridge strategies (pick one)

**Strategy A: EventBus Subscriber** (best if the bot has a pub/sub system)
- Register a subscriber/listener on the bot's event bus
- Translate each event to UTI format
- Write to a JSONL file

**Strategy B: Log File Transformer** (best if the bot writes structured logs)
- Tail the bot's existing log file
- Parse and translate each line to UTI format
- Write to a separate JSONL file for the sidecar

**Strategy C: Database Poller** (best if the bot stores telemetry in a DB)
- Poll the bot's telemetry DB for new records (using a watermark/last-seen ID)
- Translate rows to UTI events
- Write to a JSONL file

**Strategy D: Direct HTTP Forwarder** (best if the bot has no persistent telemetry)
- Create a lightweight process that generates heartbeats
- Subscribe to Docker events directly
- POST events to the telemetry API (skip the sidecar entirely)

### Bridge output format

Write one JSON object per line to the JSONL file. The sidecar's log_tailer expects lines matching this schema:

```jsonl
{"timestamp": "2026-03-22T19:00:00Z", "bot_id": "uuid-here", "event_type": "heartbeat", "payload": {"uptime_seconds": 3600}}
{"timestamp": "2026-03-22T19:00:01Z", "bot_id": "uuid-here", "event_type": "token_usage", "payload": {"model": "gpt-4o", "input_tokens": 150, "output_tokens": 80}}
{"timestamp": "2026-03-22T19:00:02Z", "bot_id": "uuid-here", "event_type": "message", "payload": {"channel": "telegram", "direction": "inbound"}}
```

All four envelope keys (`timestamp`, `bot_id`, `event_type`, `payload`) are required. Lines missing any key are silently dropped.

### Heartbeat generation

The bridge MUST emit periodic heartbeats (every 60s recommended). Without heartbeats, the dashboard will show the bot as "Offline" even if it's running. The dashboard status thresholds are:

- **Online**: last_seen < 2 minutes ago
- **Idle**: last_seen < 10 minutes ago
- **Offline**: last_seen >= 10 minutes ago

## Phase 4: Deploy the Sidecar

### Get the sidecar codebase

The sidecar is the same Python package used by Nook and DB. Copy it from ROG:

```bash
# Copy the sidecar codebase
scp -r rog:~/nook-sidecar/ <target-host>:~/<bot>-sidecar/

# Or if deploying locally on macOS
scp -r rog:~/nook-sidecar/ ~/mbot-sidecar/
```

### Configure environment

Create `.env` in the sidecar directory:

```bash
TELEMETRY_URL=http://100.99.148.99:3100    # ROG Tailscale IP (use localhost if on ROG)
REGISTRATION_TOKEN=<token-from-phase-1>
BOT_ID=<bot-id-from-phase-1>
LOG_PATH=<path-to-bridge-jsonl-output>
WATCH_CONTAINER=<docker-container-name>     # Optional: enables lifecycle events
WATCH_CONFIGS=<comma-separated-config-paths> # Optional: enables config change detection
```

**Networking**: The sidecar must reach ROG's telemetry API at port 3100. Use:
- `http://localhost:3100` if sidecar runs on ROG
- `http://100.99.148.99:3100` if sidecar runs on another Tailscale machine
- Ensure the machine is on the `neuronbox.ai` tailnet

### Create Python venv and install deps

```bash
cd ~/<bot>-sidecar
python3 -m venv .venv
source .venv/bin/activate
pip install httpx docker   # docker package only needed if WATCH_CONTAINER is set
```

### Platform-specific service setup

**Linux (systemd)**:

```ini
# ~/.config/systemd/user/<bot>-sidecar.service
[Unit]
Description=UTI Telemetry Sidecar for <BotName>
After=network.target docker.service

[Service]
WorkingDirectory=/home/<user>/<bot>-sidecar
ExecStart=/home/<user>/<bot>-sidecar/.venv/bin/python3 -m src.main
Restart=on-failure
RestartSec=5
EnvironmentFile=/home/<user>/<bot>-sidecar/.env

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now <bot>-sidecar
```

**macOS (launchd)**:

```xml
<!-- ~/Library/LaunchAgents/ai.neuronbox.<bot>-sidecar.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.neuronbox.<bot>-sidecar</string>
    <key>WorkingDirectory</key>
    <string>/Users/<user>/<bot>-sidecar</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/<user>/<bot>-sidecar/.venv/bin/python3</string>
        <string>-m</string>
        <string>src.main</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/<user>/<bot>-sidecar/sidecar.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/<user>/<bot>-sidecar/sidecar.err</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>TELEMETRY_URL</key>
        <string>http://100.99.148.99:3100</string>
        <key>REGISTRATION_TOKEN</key>
        <string>REPLACE_ME</string>
        <key>BOT_ID</key>
        <string>REPLACE_ME</string>
        <key>LOG_PATH</key>
        <string>/Users/<user>/<bot>-sidecar/events.jsonl</string>
        <key>WATCH_CONTAINER</key>
        <string>REPLACE_ME</string>
    </dict>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/ai.neuronbox.<bot>-sidecar.plist
launchctl start ai.neuronbox.<bot>-sidecar
```

## Phase 5: Verify End-to-End

### 1. Check sidecar is running

```bash
# Linux
systemctl --user status <bot>-sidecar

# macOS
launchctl list | grep <bot>-sidecar
cat ~/<bot>-sidecar/sidecar.log | tail -20
```

### 2. Check events are arriving

```bash
# Query the telemetry API for recent events from this bot
ssh rog "curl -s 'http://localhost:3100/api/events?bot_id=<bot-id>&limit=5'" | python3 -m json.tool
```

### 3. Check dashboard status

```bash
# Check last_seen_at is recent
ssh rog "curl -s http://localhost:3100/api/bots" | python3 -m json.tool | grep -A2 "<BotName>"

# Or hit the dashboard directly
ssh rog "curl -s -o /dev/null -w '%{http_code}' http://localhost:3100/dashboard/"
```

### 4. Check metrics are populating

```bash
# Check hourly aggregates exist
ssh rog "sqlite3 ~/telemetry-service/telemetry.db \"SELECT event_type, count, message_count, error_count FROM hourly_aggregate WHERE bot_id='<bot-id>' ORDER BY hour DESC LIMIT 10\""
```

### Common issues

| Symptom | Cause | Fix |
|---|---|---|
| Bot shows "Offline" | No events ingested recently | Check sidecar is running, check bridge is writing JSONL |
| 401 on ingest | Bad registration token | Verify token matches DB: `sqlite3 telemetry.db "SELECT registration_token FROM bot WHERE name='...'"` |
| 403 on ingest | bot_id mismatch | Ensure `bot_id` in JSONL events matches the authenticated bot |
| Events arrive but 0 messages/errors | Wrong event_type | Check payload has correct fields for the event type |
| Sidecar crashes on start | Missing deps | Install `httpx` (required) and `docker` (only if WATCH_CONTAINER set) |
| Can't reach telemetry API | Network/Tailscale issue | Verify Tailscale is up: `tailscale status`, ping `100.99.148.99` |
| JSONL lines silently dropped | Missing envelope keys | Every line needs all 4 keys: timestamp, bot_id, event_type, payload |

## Reference: Registered Bots

| Bot | bot_id | Host | Sidecar Status |
|---|---|---|---|
| DB | `90162a8a-70eb-4d53-ab7a-359380ac34f2` | EC2 (100.88.246.12) | systemd: uti-telemetry-sidecar |
| Nook | `ee088199-6990-4818-ae58-a1be1cc8d4bb` | ROG (100.99.148.99) | systemd: nook-sidecar |
| X | `9df2f496-0348-4e13-a141-66d3fd274150` | XPS (100.82.106.19) | Built into NanoClaw |
| M-Bot | `9ffb22c5-2d52-4f7f-a6b4-bd571ebaa55f` | Mac (localhost) | NEEDS SIDECAR |

## Reference: Key Files in X-nanoclaw Repo

| File | Purpose |
|---|---|
| `telemetry/src/routers/ingest.py` | Ingest endpoint — event validation, aggregation, last_seen update |
| `telemetry/src/models.py` | DB models: Bot, Event, HourlyAggregate, DailyAggregate |
| `telemetry/src/auth.py` | Auth logic: registration token → bot lookup |
| `dashboard/src/lib/status.ts` | Online/Idle/Offline thresholds (2min/10min) |
| `dashboard/src/pages/Overview.tsx` | Dashboard overview — how bot cards render |
| `src/tools/config.ts` | Bot config schema (ssh_target, container, framework, etc.) |
| `scripts/x-onboard.ts` | CLI onboarding script |
| `scripts/x-offboard.ts` | CLI offboarding script |
| `bot-anatomy/*.md` | Per-bot architecture reference |
