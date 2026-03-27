---
name: telemetry-push
description: "Dashboard telemetry schema and push protocol for Claw fleet bots. Use when defining what to log, event formats, push endpoints, or when user mentions 'dashboard', 'metrics', 'telemetry', 'monitoring', 'logging', 'observability'."
---

# /telemetry-push

Telemetry schema and push protocol for Claw fleet bots reporting to a central dashboard.

## Event Types

| Event Type | Purpose | Typical Frequency |
|------------|---------|-------------------|
| `health` | Periodic check results (uptime, connectivity, model reachability) | Every 5 minutes |
| `error` | Failures, exceptions, unhandled rejections | On occurrence |
| `usage` | Interaction counts, tool calls, token consumption | Hourly or daily rollup |
| `latency` | Response times for model calls, tool executions, transport round-trips | Per-request or sampled |
| `deployment` | Deploy start, end, and result (success/failure/rollback) | On deploy |
| `escalation` | Inter-bot handoffs, human escalation triggers | On occurrence |

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| `critical` | Immediate attention required — bot down, data loss, security issue | Page on-call, auto-create incident |
| `warning` | Degraded operation — high error rate, slow responses, partial outage | Alert channel, queue investigation |
| `info` | Normal operation — routine events, successful deploys, health checks passing | Dashboard display, no alert |
| `debug` | Verbose diagnostic data — full request/response metadata, timing breakdowns | Disabled by default, enable per-bot |

## Required Payload Fields

Every telemetry event MUST include these top-level fields:

| Field | Type | Description |
|-------|------|-------------|
| `bot_id` | string | Unique identifier for the bot (e.g., `db-neuron`, `ops-manager`) |
| `event_type` | string | One of: `health`, `error`, `usage`, `latency`, `deployment`, `escalation` |
| `severity` | string | One of: `critical`, `warning`, `info`, `debug` |
| `timestamp` | string | ISO 8601 format with timezone (e.g., `2026-03-16T14:30:00Z`) |
| `data` | object | Event-specific payload — see `references/event-schema.md` for schemas |

Optional fields: `correlation_id` (trace across events), `environment` (prod/staging), `version` (bot version string).

## Push Protocol

- **Method:** HTTP POST to a configurable endpoint (set via `TELEMETRY_ENDPOINT` env var)
- **Content-Type:** `application/json`
- **Body:** Single event object OR array of events (batch mode)
- **Authentication:** Bearer token via `Authorization` header (`TELEMETRY_TOKEN` env var)
- **Batch support:** Array of event objects in a single POST. Max 100 events per batch. Prefer batching for `usage` and `latency` events.
- **Retry policy:** On 5xx or network failure, retry up to 3 times with exponential backoff: 1s, 4s, 16s. On 4xx, do not retry (log locally and drop).
- **Timeout:** 10 seconds per request. If timeout, treat as network failure and retry.
- **Local fallback:** If all retries fail, write events to a local file (`/tmp/telemetry-buffer.jsonl`) for later replay.

## What to Log

- Health check results (pass/fail per check, overall status)
- Deploy outcomes (transport, duration, success/failure, rollback)
- Error rates and exception types (not full stack traces at `info` level)
- User interaction counts (messages received, responses sent) — counts only
- Tool call counts and success rates
- Escalation events (target bot, reason, outcome)
- Self-improvement results (what changed, before/after metrics)
- Model latency percentiles (p50, p95, p99)

## What NOT to Log

- User message content or conversation text
- Credentials, tokens, API keys (even partial)
- PII (names, emails, phone numbers from conversations)
- Full conversation transcripts
- Internal reasoning or chain-of-thought
- File contents from user uploads
- Database query results containing user data

## Dashboard

- Format: Grafana-compatible JSON data source
- Single dashboard displays all fleet bots, filtered by `bot_id`
- Standard panels: health status grid, error rate time series, usage bar charts, latency histograms, deployment timeline, escalation log
- Alert rules configured per severity level in Grafana
- Retention: 30 days hot (queryable), 90 days cold (archived), then deleted

See `references/event-schema.md` for complete JSON schemas and examples for each event type.
