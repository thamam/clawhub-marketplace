# Self-Improvement Patterns Reference

## Reflection Prompt Templates

Use these when running step 2 (Reflect). Adapt the framing to the bot's persona.

### Daily (lightweight)

```
Review my last 5 conversations. For each one:
1. Did the user get what they needed on the first try?
2. Did I use the right tools, or did I fumble?
3. Was my tone appropriate for the channel and context?
4. Did I say anything wrong or misleading?
5. Was there a moment I should have searched memory or the web but didn't?
```

### Weekly (deep)

```
Across all conversations this week:
1. What question or request came up more than once?
2. Which tool did I fail to use correctly most often?
3. Did any user correct me? What was the pattern?
4. Were there conversations where I was noticeably slow or verbose?
5. Did I miss context that was available in memory?
6. What knowledge gap blocked me most?
```

### Monthly (persona review)

```
Read my full persona files (IDENTITY, SOUL, AGENTS, RULES).
1. Does my actual behavior match what these files describe?
2. Are there rules I consistently ignore? Why?
3. Are there rules that are outdated or no longer useful?
4. Has my tone drifted from the intended style?
5. Should any accumulated learnings be promoted to persona-level rules?
```

---

## Common Improvement Categories

### Knowledge gaps
- Bot didn't know a fact it should have (team member name, project detail, tool syntax)
- **Fix:** Add to memory (Letta archival, OpenClaw MEMORY.md, or relevant workspace file)

### Tone issues
- Too formal in casual channel, too casual in professional context
- Language mixing (Hebrew response to English query, or vice versa)
- Over-explaining simple things, or being too terse on complex topics
- **Fix:** Update AGENTS.md or persona memory block with explicit channel-tone rules

### Tool usage mistakes
- Called the wrong tool, called it with wrong arguments, or didn't call it when needed
- Excessive retries on a failing tool instead of reporting the error
- **Fix:** Add to TOOLS.md or learnings file with the correct invocation pattern

### Slow responses
- Multi-step tasks that stalled in a planning loop
- Unnecessary searches when the answer was in memory
- Repeated web searches for the same query
- **Fix:** Add decision shortcut to learnings (e.g., "for X, always check memory first")

### Missed context
- Forgot something from earlier in the conversation
- Didn't recall a relevant memory that existed
- Ignored channel-specific context (group vs DM, time of day)
- **Fix:** Review memory recall configuration; add explicit "check memory for X" rules

### Language mixing errors
- Responded in wrong language for the channel
- Mixed Hebrew and English mid-sentence without reason
- Translated a proper noun that should stay in original language
- **Fix:** Add language rules to AGENTS.md (e.g., "this channel is Hebrew-first, technical terms stay in English")

---

## Anti-Drift Guardrails

### NEVER change these without explicit user request:
- Bot name, emoji, or identity
- Channel assignments (which channels the bot operates in)
- Security constraints (auth, permissions, API key handling)
- Core personality traits defined in SOUL.md or persona memory
- Who the bot reports to / takes orders from

### NEVER do these during self-improvement:
- Delete a working behavior because it "could be better"
- Add a new tool integration without user approval
- Change response language defaults
- Expand the bot's role or scope
- Modify cron schedules or automation triggers
- Promote a one-time correction to a permanent rule (needs 3+ occurrences)

### Safe to change without asking:
- Adding factual knowledge to memory
- Fixing a documented tool invocation pattern
- Adjusting verbosity within the existing tone guidelines
- Adding a new entry to learnings/patterns files
- Correcting a typo or outdated reference in workspace files

---

## Storage Patterns by Framework

### OpenClaw (DB, M-Bot)

```
# Fast learnings (tier 1) -- write immediately
~/.openclaw/workspaces/<workspace>/.learnings/LEARNINGS.md

# Persistent patterns (tier 2) -- after 3+ occurrences
~/.openclaw/workspaces/<workspace>/memory/patterns.md
# or MEMORY.md for cross-session facts

# Persona changes (tier 3) -- monthly review only
~/.openclaw/workspaces/<workspace>/SOUL.md
~/.openclaw/workspaces/<workspace>/AGENTS.md
~/.openclaw/workspaces/<workspace>/RULES.md

# High-value improvements (tier 4) -- GitHub issue
# Use the bot's own issue repo with [self-improvement] prefix:
#   DB:    neuron-box/db-issues
#   Nook:  neuron-box/nook-issues
#   X:     neuron-box/x-issues
#   M-Bot: neuron-box/mbot-issues
```

### Letta (Lettabot)

```
# Fast learnings -- core memory block
letta.update_block(block_id, value="learnings: ...")

# Persistent patterns -- archival memory
letta.insert_archival_memory(agent_id, "Pattern: ...")

# Persona changes -- core memory persona block
letta.update_block(persona_block_id, value="updated persona...")
```

### Nook

```
# All tiers use workspace files
workspace/patterns.md     -- learnings + patterns
workspace/persona.md      -- identity + tone
workspace/rules.md        -- operational rules
```

---

## Good vs Bad Improvements

### Good

> **2026-03-10 -- Tool usage fix**
> Source: Conversation with Tomer, he asked to search and I used native web_search (broken) instead of Tavily skill.
> Change: Added to LEARNINGS.md: "Always use `node ~/.openclaw/skills/tavily-search/scripts/search.mjs` for web searches. Native web_search tool is disabled."
> Why: Native tool returns empty results silently. Tavily skill is the only working search path.

> **2026-03-12 -- Knowledge gap**
> Source: User asked about the S3 upload pipeline, I didn't know the bucket name.
> Change: Added to MEMORY.md: "S3 bucket: neuronbox-media, prefixes: podcasts/, videos/, etc."
> Why: This is a frequently referenced fact that should be in active memory.

### Bad

> ~~**Tone change: switching to more casual Hebrew**~~
> Rejected: No user request for tone change. Current tone is working. Violates anti-drift rule.

> ~~**Adding Brave Search API integration**~~
> Rejected: This is a new tool integration, not a self-improvement. Requires user approval.

> ~~**Removing "require approval for destructive actions" rule because it slowed me down once**~~
> Rejected: Security constraint removal. One occurrence is not a pattern. Rule stays.
