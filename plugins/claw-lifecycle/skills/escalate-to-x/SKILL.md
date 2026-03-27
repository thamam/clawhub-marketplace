---
name: escalate-to-x
description: "Inter-bot escalation protocol for the Claw fleet. Use when a bot can't handle a request, needs to open a GitHub issue, or communicate with X (service bot). Trigger on 'escalate', 'open issue', 'tell X', 'can not handle this', 'out of scope', 'need help from another bot'."
---

# Escalate-to-X: Inter-Bot Escalation Protocol

## When to Escalate

Escalate when any of the following are true:

- **Task outside bot's domain** -- the request requires capabilities, data, or access this bot does not have
- **Repeated failures** -- 3 or more attempts at the same task have failed with different approaches
- **User explicitly asks** -- the user says "escalate", "open an issue", "tell X", or similar
- **Security concern** -- the bot detects a potential security issue (leaked credentials, suspicious activity, unauthorized access attempt)
- **Cross-bot coordination needed** -- the task requires action from multiple bots or handoff to a specific bot

Do NOT escalate on the first failure. Attempt the task, diagnose the issue, and try at least one alternative approach before escalating.

## Escalation Targets

| Target | When to Use | How |
|--------|-------------|-----|
| **X (service bot)** | Cross-bot tasks, fleet-wide actions, tasks requiring another bot's capabilities | Send structured message via Slack or agent-to-agent protocol |
| **GitHub Issues** | Bugs, feature requests, recurring failures, self-improvement proposals | Create issue in the bot's issue tracker repo using the template |
| **Slack channel** | Urgent issues requiring immediate human attention (P0/P1) | Send formatted message to the designated ops channel |

## Severity Levels

| Level | Name | Definition | Response Time |
|-------|------|------------|---------------|
| **P0** | Critical | Blocking a user right now. Service is down or producing incorrect results that could cause harm. | Immediate -- escalate + alert human |
| **P1** | High | Degraded service. Core functionality impaired but workaround exists. | Within 1 hour |
| **P2** | Medium | Inconvenience. Non-critical feature broken or quality degraded. | Within 1 business day |
| **P3** | Low | Enhancement. Suggestion for improvement, minor polish, nice-to-have. | Backlog |

## Context to Include

**Always include in every escalation:**

- Bot ID (which bot is escalating)
- Timestamp (ISO 8601 format)
- Conversation summary (1-3 sentences of what the user wanted)
- What was attempted (numbered steps)
- What failed (error message or reason)
- User's original intent (one sentence)
- Severity level (P0-P3)

**Never include:**

- Full conversation transcript (too noisy; summarize instead)
- Credentials, tokens, API keys, or secrets
- Personally identifiable information (PII) -- names, emails, phone numbers
- Internal file paths or infrastructure details beyond what is needed for diagnosis

## Escalation Format

Use the template from `references/escalation-template.md` for all escalations.

For **GitHub Issues**, create the issue with the full template and apply appropriate labels (bug, task, improvement, priority level).

For **Slack urgent alerts** (P0/P1 only), use the compact format from the template's Slack section.

For **agent-to-agent** messages to X, include the structured context block so the receiving bot can act without asking clarifying questions.

## Tracking

- **Always include the issue or ticket number** in your response to the user so they can follow up
- If the escalation target responds with a resolution, relay the outcome back to the user
- If no resolution arrives within the expected response time for the severity level, follow up once
- Log the escalation in the bot's session memory for cross-session awareness

## Anti-Patterns

These are common mistakes. Do not do them:

- **Escalating things you can handle** -- if the task is within your capabilities, do it. Escalation is not delegation.
- **Escalating without attempting first** -- always try at least once. The escalation must include "what was attempted."
- **Escalating the same thing twice** -- if you already escalated an issue and have no new information, do not create a duplicate. Reference the existing issue instead.
- **Over-escalating severity** -- a minor inconvenience is not P0. Reserve P0 for genuine service-down situations.
- **Under-describing the problem** -- "it doesn't work" is not an escalation. Include the error, the steps, and the context.
- **Including sensitive data** -- sanitize all context before sending. Strip credentials, PII, and unnecessary internal details.
- **Escalating to avoid work** -- if you are stuck, say so honestly. Escalation is for genuine capability gaps, not task avoidance.
