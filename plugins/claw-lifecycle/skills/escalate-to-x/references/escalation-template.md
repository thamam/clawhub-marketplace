# Escalation Templates

## GitHub Issue Template

Use this format when creating an issue in the bot's issue tracker repository.

**Fleet issue repos:**
- DB: `neuron-box/db-issues`
- Nook: `neuron-box/nook-issues`
- X: `neuron-box/x-issues`
- M-Bot: `neuron-box/mbot-issues`

```markdown
## Escalation from [BOT_NAME]

**Severity:** P[0-3]
**Timestamp:** [ISO 8601]
**User Intent:** [one sentence]

### What was attempted
- [step 1]
- [step 2]

### What failed
[error or reason]

### Suggested action
[what the receiving bot/human should do]

### Context
[relevant conversation excerpt, sanitized]
```

### Field Guidelines

| Field | Example | Notes |
|-------|---------|-------|
| BOT_NAME | DB (neuron) | The escalating bot's display name and ID |
| Severity | P1 | Use P0-P3 scale from SKILL.md |
| Timestamp | 2026-03-16T14:30:00Z | Always UTC, ISO 8601 |
| User Intent | "User wanted to generate a weekly newsletter podcast" | One sentence, no PII |
| What was attempted | Numbered list of actions taken | Be specific -- include tool names, commands, approaches |
| What failed | "NotebookLM returned 403: session cookies expired" | Exact error when available |
| Suggested action | "Refresh Google auth cookies in .storage.json" | Actionable, not vague |
| Context | Sanitized excerpt | Strip credentials, PII, internal paths |

### Labels to Apply

Apply labels based on the nature of the escalation:

- `bug` -- something that used to work is broken
- `task` -- a concrete action item for someone to do
- `improvement` -- a suggestion to make something better
- `self-improvement` -- bot-initiated learning or workspace update
- `priority:high` / `priority:medium` / `priority:low` -- matches P1/P2/P3

P0 issues should always get `priority:high` plus `blocker`.

---

## Slack Urgent Message Format (P0/P1 Only)

Use this format for time-sensitive escalations that need immediate human attention. Send to the designated ops channel.

```
:rotating_light: *ESCALATION from [BOT_NAME]* | *P[0-1]*

*What:* [one-line summary of the problem]
*Impact:* [who/what is affected right now]
*Attempted:* [brief list of what was tried]
*Error:* `[error message or reason]`
*Action needed:* [what a human should do]

_Ref: [GitHub issue URL if created]_
```

### Example

```
:rotating_light: *ESCALATION from DB (neuron)* | *P0*

*What:* Gateway container crashed during cron job, not auto-recovering
*Impact:* All 4 channels offline, no bot responses
*Attempted:* Detected via heartbeat failure, checked docker logs, found OOM kill
*Error:* `Killed process 7 (node) total-vm:2048000kB, anon-rss:1900000kB`
*Action needed:* SSH to EC2, run `docker compose up -d openclaw-gateway`, investigate memory leak

_Ref: https://github.com/neuron-box/db-issues/issues/42_
```

---

## Agent-to-Agent Message Format

Use this format when sending an escalation to X (service bot) or another bot in the fleet via Slack or agent-to-agent protocol.

```
[ESCALATION]
From: [BOT_NAME]
Severity: P[0-3]
Timestamp: [ISO 8601]
Intent: [user's original request]
Attempted: [what this bot tried]
Failed: [why it could not complete the task]
Request: [specific action for the receiving bot]
Context: [sanitized relevant details]
[/ESCALATION]
```

The structured block markers (`[ESCALATION]` / `[/ESCALATION]`) allow the receiving bot to parse the escalation programmatically and act without needing to ask clarifying questions.
