---
name: bot-dashboard-offboard
description: >
  Offboard a bot from the UTI telemetry dashboard. Use when decommissioning a bot,
  removing it from monitoring, or cleaning up after a bot is no longer in service.
  Performs a soft-delete via the telemetry API and reminds you to clean up the sidecar.
argument-hint: <bot-name-or-id>
tags: [telemetry, dashboard, offboarding, cleanup, monitoring]
allowed-tools: Bash(curl:*), Bash(python3:*), Bash(ssh:*)
---

# Bot Dashboard Offboarding

You are offboarding a bot from the UTI (Unified Telemetry Interface) dashboard. This is a destructive operation — confirm carefully before proceeding.

## Step 1: Resolve the Bot

The user will provide a bot name or bot_id. Look up the bot from the registry to get its full details.

```bash
# Fetch all registered bots
curl -s http://100.99.148.99:3100/api/bots | python3 -m json.tool
```

Match the user's argument against the `name` field (case-insensitive) or the `id` field. If no match is found, list available bots and ask the user to clarify.

## Step 2: Show Bot Details and Confirm

Display these fields to the user before proceeding:

- **Name**: the bot's registered name
- **Bot ID**: the bot's UUID
- **Last Seen**: `last_seen_at` value (note how long ago this was)
- **Created**: `created_at` value
- **Status**: Online/Idle/Offline based on last_seen_at thresholds (Online < 2min, Idle < 10min, Offline >= 10min)

Then **ask the user to confirm** they want to soft-delete this bot. Do NOT proceed without explicit confirmation. Say something like:

> This will soft-delete **BotName** (`<bot-id>`) from the telemetry dashboard. The bot's historical data will be preserved but it will no longer appear in the active bot list. Proceed?

## Step 3: Soft-Delete via API

Once the user confirms, call the delete endpoint with admin auth:

```bash
curl -s -X DELETE http://100.99.148.99:3100/api/bots/<bot-id> \
  -H "Authorization: Bearer b88c98bb89a2a6e10883d0869d1d22948ce51fe26e7228333af7836b46baab9b" \
  -w "\nHTTP %{http_code}\n"
```

Check the response:
- **200/204**: Success — bot has been soft-deleted
- **401/403**: Auth failure — check admin key
- **404**: Bot not found — may already be deleted

Report the result to the user.

## Step 4: Sidecar Cleanup Reminder

After the soft-delete succeeds, remind the user that the bot's sidecar/telemetry bridge is still running on the host machine and should be stopped and removed. Tailor the instructions based on the bot's known host:

### Known bot hosts

| Bot | Host | Sidecar Service |
|---|---|---|
| DB | EC2 (100.88.246.12), ssh alias `ec2` | `systemctl --user stop uti-telemetry-sidecar && systemctl --user disable uti-telemetry-sidecar` |
| Nook | ROG (100.99.148.99), ssh alias `rog` | `systemctl --user stop nook-sidecar && systemctl --user disable nook-sidecar` |
| X | XPS (100.82.106.19), ssh alias `xps` | Built into NanoClaw — remove service-bot tools config instead |
| M-Bot | Mac (localhost) | launchd: `launchctl unload ~/Library/LaunchAgents/ai.neuronbox.mbot-sidecar.plist` |

### Generic sidecar cleanup (Linux/systemd)

```bash
# Stop and disable the sidecar service
ssh <host> "systemctl --user stop <bot>-sidecar && systemctl --user disable <bot>-sidecar"

# Remove the service file and reload
ssh <host> "rm ~/.config/systemd/user/<bot>-sidecar.service && systemctl --user daemon-reload"

# Optionally remove the sidecar directory
ssh <host> "rm -rf ~/<bot>-sidecar"
```

### Generic sidecar cleanup (macOS/launchd)

```bash
# Unload and remove the plist
launchctl unload ~/Library/LaunchAgents/ai.neuronbox.<bot>-sidecar.plist
rm ~/Library/LaunchAgents/ai.neuronbox.<bot>-sidecar.plist

# Optionally remove the sidecar directory
rm -rf ~/<bot>-sidecar
```

### Additional cleanup

Remind the user to also consider:

- **bot-anatomy doc**: Archive `bot-anatomy/<BotName>.md` if it exists (move to `bot-anatomy/archive/`)
- **Issue repo**: The bot's GitHub issue repo (under `neuron-box/`) can be archived separately if no longer needed
- **X config refresh**: X will stop monitoring the bot on its next config refresh (within 5 minutes of soft-delete)
