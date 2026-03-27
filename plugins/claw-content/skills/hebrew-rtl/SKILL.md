---
name: hebrew-rtl
description: "Mixed Hebrew/English RTL handling for Claw fleet bots. Use when composing messages with Hebrew text, handling BiDi, formatting code blocks in Hebrew context, or when user mentions 'Hebrew', 'RTL', 'right to left', 'עברית', 'BiDi', or when outputting mixed Hebrew/English text."
---

# /hebrew-rtl

Rules and patterns for correct bidirectional (BiDi) text handling when composing messages that mix Hebrew and English.

## 1. Core BiDi Rules

The Unicode Bidirectional Algorithm (UBA) determines display order:

- **Hebrew characters** (U+0590-U+05FF, U+FB1D-U+FB4F) trigger RTL direction
- **Latin characters** (A-Z, a-z) and **ASCII digits** (0-9) trigger LTR direction
- **Neutral characters** (spaces, punctuation, brackets) inherit direction from surrounding strong characters
- **Paragraph direction** is determined by the first strong character in the paragraph

When auto-detection fails, use invisible direction markers:
- **U+200F** (RLM, Right-to-Left Mark) — forces RTL context at insertion point
- **U+200E** (LRM, Left-to-Right Mark) — forces LTR context at insertion point
- Insert these *before* the character whose direction is being misread

## 2. Mixed Content Patterns

### Hebrew sentence with English word

Usually works automatically. The English word appears LTR within the RTL flow. Add LRM before/after the English segment only if direction breaks visibly.

Example: `הפרויקט נקרא OpenClaw והוא עובד` renders correctly because "OpenClaw" is a single LTR island.

Problem case: `הפרויקט נקרא OpenClaw.` — the period may attach to the wrong side. Fix: `הפרויקט נקרא OpenClaw‎.` (LRM before period).

### Hebrew with numbers

Numbers are always LTR. Simple numbers in Hebrew text work fine: `יש 42 הודעות` displays correctly.

Problem case: Numbers with surrounding punctuation — parentheses, brackets, slashes. `(42)` in Hebrew context can render as `)42(`. Fix: Wrap with LRM: `‎(42)‎`.

### Hebrew with URLs

URLs are always LTR. They usually display correctly as LTR islands.

Problem case: Hebrew text ending with a period, immediately followed by a URL. The period gets pulled into the URL or appears between the URL and Hebrew text. Fix: Add LRM after the Hebrew period and before the URL.

### Hebrew with inline code

Inline code (backtick-wrapped) is LTR. The backtick characters are neutral and can be swallowed by RTL context.

Problem case: `` הרץ את `npm install` `` — backticks may render incorrectly. Fix: Add LRM before opening backtick: `הרץ את ‎` followed by the backticked code.

## 3. Code Blocks

Code inside fenced code blocks (triple backticks) is always LTR, regardless of content. This is correct behavior — code should never be RTL.

Rules:
- If the line immediately before a code block ends with Hebrew text, add a blank line between the Hebrew text and the opening ` ``` `. Some renderers misparse the backticks in RTL context without the gap.
- Comments inside code can be Hebrew. They will display LTR (left-aligned) which is acceptable in code context.
- Do not insert RLM/LRM inside code blocks — they become visible garbage characters.

## 4. Lists and Bullets

- **RTL lists:** When a list item starts with a Hebrew character, the bullet/number appears on the right and text flows right-to-left.
- **LTR lists:** When a list item starts with a Latin character, normal LTR rendering.
- **Mixed items:** Each item's direction is independent, determined by its first strong character.
- **Numbered lists:** In RTL context, the number appears on the right: `.1`, `.2`, `.3`. This is correct behavior.
- **Nested lists:** Indentation direction follows the parent item's direction.

## 5. Common Mistakes

| Mistake | Cause | Fix |
|---------|-------|-----|
| Reversed parentheses: `)(` instead of `()` | Neutral characters inherit RTL | Wrap with LRM: `‎()‎` |
| Period at wrong end of sentence | Period is neutral, attaches to RTL | Add LRM before period: `text‎.` |
| English word at line start instead of end | Paragraph direction set to LTR | Ensure first character is Hebrew, or prefix with RLM |
| Colon appearing on wrong side | Colon is neutral | Add RLM after the Hebrew word before colon: `שם‏:` |
| Broken markdown bold in Hebrew | `*` is neutral, BiDi pairs break | Ensure no direction change between `*` markers |
| Emoji resetting direction mid-sentence | Emoji are neutral characters | Add RLM after emoji if Hebrew follows: `🧠‏ נירון` |

## 6. Platform-Specific

Read `references/platform-rules.md` for detailed rules per platform (Slack, Telegram, WhatsApp, Discord). Each platform handles RTL differently — what works in Telegram may break in Slack.

Key differences:
- **Telegram** has the best native RTL support (auto-detects paragraph direction)
- **Slack** has no native RTL — requires manual RLM insertion throughout
- **WhatsApp** has good RTL but markdown markers can break BiDi pairing
- **Discord** is similar to Slack — partial support, needs manual markers

## 7. Testing

- Always preview in the target platform before sending. Desktop and mobile render BiDi differently.
- Test with: pure Hebrew, pure English, Hebrew-then-English, English-then-Hebrew, Hebrew with numbers, Hebrew with URLs, Hebrew with code.
- Mobile devices sometimes handle BiDi better than desktop clients (especially Telegram).
- If a message looks correct in one platform but broken in another, add explicit direction markers rather than relying on auto-detection.
