# Telemetry Event Schema Reference

Complete JSON schemas and examples for each telemetry event type.

## Common Envelope

Every event shares this structure:

```json
{
  "bot_id": "string — required",
  "event_type": "string — required (health|error|usage|latency|deployment|escalation)",
  "severity": "string — required (critical|warning|info|debug)",
  "timestamp": "string — required (ISO 8601)",
  "correlation_id": "string — optional (trace ID)",
  "environment": "string — optional (prod|staging)",
  "version": "string — optional (bot version)",
  "data": {}
}
```

---

## Health Event

Periodic health check results. Each check is a named probe (model reachability, transport status, memory usage, etc.).

```json
{
  "bot_id": "db-neuron",
  "event_type": "health",
  "severity": "info",
  "timestamp": "2026-03-16T14:30:00Z",
  "environment": "prod",
  "version": "1.4.2",
  "data": {
    "status": "healthy",
    "uptime_seconds": 432000,
    "checks": [
      {
        "name": "model_reachable",
        "status": "pass",
        "latency_ms": 230,
        "details": "claude-haiku-4-5 responded in 230ms"
      },
      {
        "name": "transport_connected",
        "status": "pass",
        "latency_ms": 12,
        "details": "Telegram webhook active"
      },
      {
        "name": "memory_usage",
        "status": "pass",
        "latency_ms": 1,
        "details": "RSS 245MB / 512MB limit"
      },
      {
        "name": "disk_space",
        "status": "warning",
        "latency_ms": 3,
        "details": "82% used on /dev/xvda1"
      }
    ]
  }
}
```

### Health `data` Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | yes | Overall: `healthy`, `degraded`, `unhealthy` |
| `uptime_seconds` | number | yes | Seconds since last container restart |
| `checks` | array | yes | Array of check objects |
| `checks[].name` | string | yes | Check identifier |
| `checks[].status` | string | yes | `pass`, `warning`, `fail` |
| `checks[].latency_ms` | number | no | Time to run the check |
| `checks[].details` | string | no | Human-readable result |

---

## Error Event

Failures and exceptions. Includes stack trace at `warning`/`critical` severity.

```json
{
  "bot_id": "db-neuron",
  "event_type": "error",
  "severity": "critical",
  "timestamp": "2026-03-16T14:32:15Z",
  "environment": "prod",
  "version": "1.4.2",
  "correlation_id": "req-abc-123",
  "data": {
    "error_code": "MODEL_TIMEOUT",
    "message": "Model API call timed out after 30000ms",
    "stack_trace": "Error: Model API call timed out after 30000ms\n    at ModelClient.call (/app/dist/model.js:142:11)\n    at async Gateway.handleMessage (/app/dist/gateway.js:88:20)\n    at async TelegramTransport.onMessage (/app/dist/transports/telegram.js:55:5)",
    "context": {
      "model": "claude-haiku-4-5",
      "provider": "amazon-bedrock",
      "timeout_ms": 30000,
      "retry_attempt": 3
    },
    "occurrence_count": 1,
    "first_seen": "2026-03-16T14:32:15Z",
    "last_seen": "2026-03-16T14:32:15Z"
  }
}
```

### Error `data` Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `error_code` | string | yes | Machine-readable error category |
| `message` | string | yes | Human-readable error description |
| `stack_trace` | string | no | Stack trace (include at warning/critical only) |
| `context` | object | no | Relevant non-PII context for debugging |
| `occurrence_count` | number | no | Times this error occurred in dedup window |
| `first_seen` | string | no | ISO 8601 timestamp of first occurrence |
| `last_seen` | string | no | ISO 8601 timestamp of most recent occurrence |

---

## Usage Event

Interaction counts and tool call statistics. Never includes message content.

```json
{
  "bot_id": "db-neuron",
  "event_type": "usage",
  "severity": "info",
  "timestamp": "2026-03-16T15:00:00Z",
  "environment": "prod",
  "version": "1.4.2",
  "data": {
    "period": "hourly",
    "period_start": "2026-03-16T14:00:00Z",
    "period_end": "2026-03-16T15:00:00Z",
    "interaction_count": 47,
    "unique_users": 8,
    "messages_received": 47,
    "messages_sent": 52,
    "tool_calls": {
      "total": 31,
      "by_tool": {
        "web-search": 12,
        "memory-recall": 9,
        "calendar-check": 6,
        "file-read": 4
      },
      "success_rate": 0.94
    },
    "tokens": {
      "input": 125400,
      "output": 48200,
      "total": 173600
    }
  }
}
```

### Usage `data` Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `period` | string | yes | Aggregation window: `hourly`, `daily` |
| `period_start` | string | yes | ISO 8601 window start |
| `period_end` | string | yes | ISO 8601 window end |
| `interaction_count` | number | yes | Total interactions in period |
| `unique_users` | number | no | Distinct users (count only, no IDs) |
| `messages_received` | number | yes | Inbound message count |
| `messages_sent` | number | yes | Outbound message count |
| `tool_calls` | object | no | Tool usage breakdown |
| `tool_calls.total` | number | yes | Total tool invocations |
| `tool_calls.by_tool` | object | no | Count per tool name |
| `tool_calls.success_rate` | number | no | 0.0-1.0 success ratio |
| `tokens` | object | no | Token consumption |
| `tokens.input` | number | no | Input tokens consumed |
| `tokens.output` | number | no | Output tokens consumed |
| `tokens.total` | number | no | Total tokens consumed |

---

## Deployment Event

Deploy lifecycle: start, end, success, failure, rollback.

```json
{
  "bot_id": "db-neuron",
  "event_type": "deployment",
  "severity": "info",
  "timestamp": "2026-03-16T16:05:30Z",
  "environment": "prod",
  "version": "1.4.3",
  "correlation_id": "deploy-20260316-1",
  "data": {
    "action": "deploy_end",
    "transport": "telegram",
    "previous_version": "1.4.2",
    "new_version": "1.4.3",
    "duration_seconds": 45,
    "result": "success",
    "changes": [
      "Updated model to claude-haiku-4-5-20260301",
      "Added memory-mongodb plugin",
      "Increased gateway timeout to 60s"
    ],
    "rollback": false,
    "triggered_by": "manual"
  }
}
```

### Deployment `data` Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | string | yes | `deploy_start`, `deploy_end`, `rollback_start`, `rollback_end` |
| `transport` | string | yes | Transport being deployed (`telegram`, `slack`, `whatsapp`) |
| `previous_version` | string | no | Version before deploy |
| `new_version` | string | no | Version being deployed |
| `duration_seconds` | number | no | Time from start to end (on `deploy_end` only) |
| `result` | string | yes | `success`, `failure`, `rolled_back` |
| `changes` | array | no | List of human-readable change descriptions |
| `rollback` | boolean | no | Whether this is a rollback deploy |
| `triggered_by` | string | no | `manual`, `cron`, `auto-update`, `escalation` |

---

## Escalation Event

Inter-bot handoffs and human escalation triggers.

```json
{
  "bot_id": "db-neuron",
  "event_type": "escalation",
  "severity": "warning",
  "timestamp": "2026-03-16T14:45:00Z",
  "environment": "prod",
  "version": "1.4.2",
  "correlation_id": "esc-20260316-7",
  "data": {
    "escalation_type": "bot_to_bot",
    "source_bot": "db-neuron",
    "target_bot": "ops-manager",
    "reason": "Persistent model timeout requiring infrastructure investigation",
    "issue_url": "https://github.com/org/repo/issues/42",
    "context": {
      "error_code": "MODEL_TIMEOUT",
      "consecutive_failures": 5,
      "duration_minutes": 15
    },
    "outcome": "accepted"
  }
}
```

### Escalation `data` Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `escalation_type` | string | yes | `bot_to_bot`, `bot_to_human`, `auto_incident` |
| `source_bot` | string | yes | Bot initiating the escalation |
| `target_bot` | string | no | Bot receiving (for `bot_to_bot`) |
| `reason` | string | yes | Human-readable escalation reason |
| `issue_url` | string | no | Link to created/referenced issue |
| `context` | object | no | Non-PII context triggering escalation |
| `outcome` | string | no | `accepted`, `rejected`, `pending`, `timeout` |

---

## Latency Event

Response time measurements for model calls, tool executions, and transport round-trips.

```json
{
  "bot_id": "db-neuron",
  "event_type": "latency",
  "severity": "info",
  "timestamp": "2026-03-16T14:31:00Z",
  "environment": "prod",
  "version": "1.4.2",
  "data": {
    "operation": "model_call",
    "model": "claude-haiku-4-5",
    "provider": "amazon-bedrock",
    "latency_ms": 1250,
    "percentiles": {
      "p50": 800,
      "p95": 2100,
      "p99": 4500
    },
    "sample_size": 100,
    "period": "5m"
  }
}
```

### Latency `data` Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `operation` | string | yes | `model_call`, `tool_execution`, `transport_roundtrip` |
| `model` | string | no | Model identifier (for model calls) |
| `provider` | string | no | Provider identifier |
| `latency_ms` | number | yes | Measured latency in milliseconds |
| `percentiles` | object | no | p50, p95, p99 over sample window |
| `sample_size` | number | no | Number of observations in window |
| `period` | string | no | Aggregation window (e.g., `5m`, `1h`) |

---

## Batch Request Example

Multiple events in a single POST:

```json
[
  {
    "bot_id": "db-neuron",
    "event_type": "health",
    "severity": "info",
    "timestamp": "2026-03-16T14:30:00Z",
    "data": {
      "status": "healthy",
      "uptime_seconds": 432000,
      "checks": [
        { "name": "model_reachable", "status": "pass", "latency_ms": 230 }
      ]
    }
  },
  {
    "bot_id": "db-neuron",
    "event_type": "usage",
    "severity": "info",
    "timestamp": "2026-03-16T14:30:00Z",
    "data": {
      "period": "hourly",
      "period_start": "2026-03-16T13:00:00Z",
      "period_end": "2026-03-16T14:00:00Z",
      "interaction_count": 23,
      "messages_received": 23,
      "messages_sent": 25,
      "tool_calls": { "total": 14, "success_rate": 1.0 }
    }
  }
]
```
