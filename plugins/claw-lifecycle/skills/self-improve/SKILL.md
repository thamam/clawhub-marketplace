---
name: self-improve
description: "Structured self-improvement routine for any Claw fleet bot. Use when the bot should reflect on recent interactions, identify behavior gaps, update memory/persona, or run a scheduled improvement cycle. Trigger on 'self-improve', 'reflect', 'learn from mistakes', 'improvement cycle'."
---

# /self-improve

Run a structured self-improvement cycle. Works for any Claw fleet bot regardless of framework (OpenClaw, Letta, Nook).

## Protocol

### 1. Collect

Gather recent signal data. Adapt sources to the bot's framework:

- **Last N conversations** -- review the most recent 5-20 interactions (5 for daily, 20 for weekly)
- **Error logs** -- tool failures, API errors, timeouts, loop detection triggers
- **User corrections** -- moments where a user said "no", "wrong", "I meant...", or rephrased their request
- **Escalations** -- times the bot couldn't answer and had to defer, ask for help, or say "I don't know"
- **Ignored messages** -- group messages the bot chose not to respond to (were those correct decisions?)

### 2. Reflect

Pattern analysis across the collected data. Ask yourself:

- What went well? (fast, accurate, tone-appropriate responses)
- What failed? (wrong answers, tool errors, hallucinations, missed context)
- What confused users? (follow-up questions, rephrasing, "that's not what I asked")
- What took too long? (multi-step tasks that stalled, excessive tool calls, loops)
- What did users like? (positive reactions, "thanks", "perfect", continued engagement)

See `references/improvement-patterns.md` for reflection prompt templates.

### 3. Prioritize

Rank findings by impact:

1. **User-facing errors** -- wrong answers, hallucinations, broken tool outputs
2. **Reliability issues** -- crashes, timeouts, loop detection, rate limits
3. **Behavior gaps** -- missing knowledge, wrong tone, language mixing
4. **Cosmetic issues** -- formatting, verbosity, emoji usage
5. **Internal inefficiency** -- redundant tool calls, slow paths (only if user-visible)

Drop anything below priority 3 unless you have capacity. Never fix more than 3 things per cycle.

### 4. Update

Write improvements to the correct storage location for this bot's framework:

| Framework | Fast learnings | Persistent patterns | Persona changes |
|-----------|---------------|--------------------|-----------------|
| **OpenClaw** | `.learnings/LEARNINGS.md` | `memory/patterns.md` or MEMORY.md | SOUL.md, AGENTS.md, IDENTITY.md |
| **Letta** | Core memory block `learnings` | Archival memory search + insert | Core memory block `persona` |
| **Nook** | `patterns.md` in workspace | `patterns.md` (same file, append) | `persona.md` in workspace |

Each entry must include:
- **Date** of the improvement
- **Source** -- which conversation or error triggered it
- **What changed** -- exact text added, removed, or modified
- **Why** -- one sentence explaining the reasoning

### 5. Guard

Anti-drift checks before committing any change. **Every improvement must pass ALL of these:**

- [ ] Does NOT contradict core persona (identity, name, role, tone)
- [ ] Does NOT remove a behavior that is currently working well
- [ ] Does NOT change communication tone without an explicit user request
- [ ] Does NOT weaken security constraints (auth, permissions, data access)
- [ ] Does NOT expand scope beyond the bot's defined role
- [ ] Is reversible -- can be undone in the next cycle if it causes problems

If any check fails, discard the improvement and log why it was rejected.

## Scheduling

| Cycle | Frequency | Scope | Duration |
|-------|-----------|-------|----------|
| Lightweight | Daily (or every 5 conversations) | Last 5 conversations, error log scan | 2-5 minutes |
| Deep | Weekly | All conversations since last deep cycle, pattern aggregation | 10-20 minutes |
| Persona review | Monthly | Full persona + rules audit against accumulated learnings | 30 minutes |

For cron-triggered cycles, run silently. Only report to the user if a significant change was made.
