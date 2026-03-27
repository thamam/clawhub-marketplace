# claw-ops-marketplace

Shared operations plugins for the Claw bot fleet: **DB**, **Lettabot**, **Nook**, **NanoClaw**, **M-Bot**.

## Install

```bash
claude plugins install ./claw-ops-marketplace
```

## Plugins (3)

### `claw-ops` — Core Operations
| Type | Item | Purpose |
|------|------|---------|
| Skill | `/bot-health` | Parameterized health checks across all bots |
| Skill | `/bot-deploy` | Deploy any bot — transport abstracted (Docker, rsync, Railway, container build) |
| Agent | `config-reviewer` | Reviews config changes against accumulated bot gotchas |
| Hook | `env-file-guard` | PreToolUse warning before modifying .env files or credentials |

### `claw-content` — Content & Output
| Type | Item | Purpose |
|------|------|---------|
| Skill | `/web-search` | Search decision framework — when to search, how to present results |
| Skill | `/notebooklm` | NotebookLM + Invideo integration for content creation |
| Skill | `/hebrew-rtl` | Mixed Hebrew/English BiDi handling per platform |

### `claw-lifecycle` — Bot Lifecycle
| Type | Item | Purpose |
|------|------|---------|
| Skill | `/self-improve` | Structured self-improvement routine with anti-drift guardrails |
| Skill | `/escalate-to-x` | Inter-bot escalation protocol — issues, context handoff, severity |
| Skill | `/telemetry-push` | Unified telemetry schema for the fleet dashboard |

## Enable selectively per project

```jsonc
// .claude/settings.json
{
  "enabledPlugins": {
    "claw-ops@claw-ops": true,        // core ops (most projects need this)
    "claw-content@claw-ops": true,     // content skills (optional)
    "claw-lifecycle@claw-ops": false   // lifecycle (optional)
  }
}
```

## Recommended MCP Servers

Install per-user (not bundled in plugin):

- **Context7**: `claude mcp add context7 -- npx -y @upstash/context7-mcp@latest`
- **Context Hub**: `npm install -g @aisuite/chub` (then `claude mcp add context-hub -- chub-mcp`)

## Per-Bot Local Automations

These stay in each bot's project directory (not in this plugin):

| Bot | Local Items |
|-----|-------------|
| DB | `db-conventions` (existing) |
| Nook | `nook-conventions` (existing), `/register-tool`, `rsync-safety-guard`, `letta-ast-validator` |
| Lettabot | `lettabot-conventions`, `/skill-scaffold` |
| NanoClaw | `nanoclaw-conventions`, `/container-test` |
| M-Bot | `mbot-conventions`, `upstream-sync` agent |
