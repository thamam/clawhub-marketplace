---
name: bot-deploy
description: "Deploy any Claw fleet bot. Use when user says 'deploy', 'push to production', 'update bot', 'release', 'ship it', or mentions deploying DB, Nook, Lettabot, NanoClaw, or M-Bot."
---

# /bot-deploy

Deploy any bot in the Claw fleet to its target environment.

## Workflow

### 1. Identify Target

Determine which bot to deploy from user context. Look up the bot in `references/bot-deploy-profiles.md` to get:
- **Transport type** (docker-compose, rsync, railway, container-build)
- **Pre-deploy checks** (if any)
- **Post-deploy verification**
- **Critical notes** (must-read before proceeding)

If the user does not specify a bot, ask. Do not guess.

### 2. Pre-Deploy Validation

Run any pre-deploy checks listed in the bot's profile. If a check fails, stop and report the failure. Do not proceed with a broken build.

### 3. Load Transport Steps

Load the matching transport reference file:
- `references/transport-docker-compose.md` -- DB, M-Bot
- `references/transport-rsync.md` -- Nook
- `references/transport-railway.md` -- Lettabot
- `references/transport-container-build.md` -- NanoClaw

Follow the transport guide step by step. Do not skip steps.

### 4. Execute Deploy

Run the deploy commands from the transport guide. Show each command and its output. If any command fails, stop and diagnose before continuing.

### 5. Post-Deploy Smoke Test

Run the post-deploy check from the bot's profile. Use `/bot-health` if available, or the custom check specified in the profile. Confirm the bot is alive and responding.

### 6. Report Result

Summarize:
- Bot name and transport used
- What changed (image rebuild, config update, code sync, etc.)
- Smoke test result (pass/fail)
- Any warnings or follow-up actions
