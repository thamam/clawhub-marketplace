# Platform-Specific RTL Rules

Detailed BiDi handling rules per messaging platform.

## Overview

| Platform | Markup | RTL Auto-Detect | Key Gotchas |
|----------|--------|-----------------|-------------|
| Slack | mrkdwn | No native RTL | Must manually insert RLM. Bold `*text*` works but can break BiDi pairing. Code blocks always LTR. Emoji in Hebrew text can reset direction. |
| Telegram | HTML or MarkdownV2 | Yes, good | HTML mode: use `<div dir="rtl">` for explicit control. MarkdownV2: inline code resets to LTR. Bot API `parse_mode` affects behavior. |
| WhatsApp | Limited markdown | Yes, good | Bold `*text*` markers can break BiDi when mixing languages. Numbered lists reversed in RTL. Links auto-detected but direction can flip. |
| Discord | Markdown | Partial | Similar to Slack. RLM characters needed. Embeds support RTL better than plain messages. |

---

## Slack (mrkdwn)

Slack has **no native RTL support**. All text defaults to LTR paragraph direction. Hebrew text displays but alignment is left, and neutral characters frequently attach to the wrong side.

### Rules

1. **Prefix Hebrew paragraphs with RLM** (U+200F) as the first character. This does not fix alignment but improves character ordering.
2. **Bold and italic:** `*bold*` and `_italic_` work but the `*` and `_` markers are neutral. If Hebrew text is immediately adjacent, the marker can jump to the wrong position. Fix: add RLM right after opening marker and before closing marker.
3. **Code blocks:** Always LTR. No fix needed or desired.
4. **Inline code:** Backticks are neutral. Add LRM (U+200E) before opening backtick when preceded by Hebrew.
5. **Links:** `<url|text>` format. If link text is Hebrew, add RLM as first character of the text portion.
6. **Emoji:** Neutral characters. When emoji appears between two Hebrew words, direction can reset. Add RLM after emoji.

### Before/After Examples

**Problem — period on wrong side:**
```
Before: שלום עולם.
Renders as: .שלום עולם
```
```
After: שלום עולם‎.
(LRM U+200E inserted before period)
Renders as: שלום עולם.
```

**Problem — bold markers displaced:**
```
Before: זה *חשוב* מאוד
Renders as: זה חשוב** מאוד
```
```
After: זה *‏חשוב‏* מאוד
(RLM U+200F after opening * and before closing *)
Renders as: זה *חשוב* מאוד
```

**Problem — emoji breaks direction:**
```
Before: 🧠 נירון מוכן
Renders as: נירון מוכן 🧠
```
```
After: 🧠‏ נירון מוכן
(RLM U+200F after emoji)
Renders as: 🧠 נירון מוכן
```

**Problem — inline code in Hebrew:**
```
Before: הרץ את `npm install` בטרמינל
Renders as: הרץ את npm install`` בטרמינל
```
```
After: הרץ את ‎`npm install`‎ בטרמינל
(LRM U+200E before opening backtick and after closing backtick)
Renders as: הרץ את `npm install` בטרמינל
```

---

## Telegram (HTML / MarkdownV2)

Telegram has **good native RTL auto-detection**. Paragraph direction is set by the first strong character. Most Hebrew text works without manual intervention.

### Rules

1. **HTML mode is preferred** for complex mixed content. Use `<div dir="rtl">` to force RTL on a block. Use `<span dir="ltr">` to protect LTR islands.
2. **MarkdownV2 mode:** Works for simple cases. Inline code (single backtick) resets direction to LTR, which is correct for code. Bold `*text*` and italic `_text_` respect surrounding direction.
3. **Bot API `parse_mode`:** Set to `HTML` for best RTL control. `MarkdownV2` is acceptable for simple messages. Plain text (no parse_mode) relies entirely on auto-detection.
4. **Links:** `<a href="url">Hebrew text</a>` in HTML mode works correctly. In MarkdownV2, `[Hebrew text](url)` usually works but URL can pull punctuation.
5. **Numbered lists:** Auto-reversed in RTL paragraphs (number on right). This is correct.

### Before/After Examples

**Problem — mixed paragraph direction wrong in MarkdownV2:**
```
Before: Deploy completed for OpenClaw v1.4.3 בהצלחה
Renders as LTR (English first character sets paragraph direction)
```
```
After (HTML mode): <div dir="rtl">Deploy completed for OpenClaw v1.4.3 בהצלחה</div>
Renders as RTL with correct flow
```

**Problem — inline code breaks Hebrew flow:**
```
Before (MarkdownV2): הרץ `npm install` ואז המתן
Renders as: הרץ npm install ואז המתן (code section resets to LTR — this is correct)
No fix needed — code should be LTR
```

**Explicit RTL block in HTML mode:**
```html
<div dir="rtl">
הבוט <b>נירון</b> פעיל ומוכן.
גרסה: <code>1.4.3</code>
סטטוס: ✅ תקין
</div>
```

---

## WhatsApp

WhatsApp has **good RTL auto-detection** similar to Telegram. Paragraph direction is determined by the first strong character.

### Rules

1. **Bold/italic markers** (`*bold*`, `_italic_`) are neutral characters. In mixed Hebrew/English, the markers can break BiDi pairing if a language switch happens between them. Keep bold/italic segments in a single language.
2. **Numbered lists:** Reversed correctly in RTL (number on right). However, if a numbered list item starts with English text in an otherwise Hebrew message, that item flips to LTR.
3. **Links:** Auto-detected URLs are always LTR. If a Hebrew sentence ends with a URL, add a space before the URL to prevent the period from being absorbed.
4. **No code blocks:** WhatsApp uses triple backticks for monospace but does not support fenced code blocks. Monospace text inherits surrounding direction.
5. **Line breaks:** Each line re-evaluates paragraph direction independently. A Hebrew line followed by an English line will have different alignments.

### Before/After Examples

**Problem — bold across language boundary:**
```
Before: זה *very important* מאוד
The * markers may pair incorrectly across the language switch
```
```
After: זה *‏very important‏* מאוד
(RLM after opening * and before closing *)
Renders correctly with bold applied to "very important"
```

**Problem — numbered list item direction:**
```
Before:
1. הפעל את הבוט
2. Run npm install
3. בדוק שהכל עובד

Item 2 renders LTR (left-aligned) while 1 and 3 are RTL (right-aligned)
```
```
After:
1. הפעל את הבוט
2. ‏Run npm install
3. בדוק שהכל עובד

(RLM U+200F prefix on item 2 forces RTL paragraph direction)
All items render RTL-aligned
```

**Problem — URL at end of Hebrew sentence:**
```
Before: לפרטים נוספים ראו https://example.com.
The period may appear between the Hebrew and URL
```
```
After: לפרטים נוספים ראו‎ https://example.com.
(LRM U+200E after Hebrew, before space+URL)
Period stays at the visual end
```

---

## Discord (Markdown)

Discord has **partial RTL support**, similar to Slack. No explicit RTL paragraph direction. Hebrew text renders but alignment is always left.

### Rules

1. **Manual RLM insertion** required, same as Slack. Prefix Hebrew paragraphs with RLM.
2. **Embeds** (rich messages via bots/webhooks) support RTL better than plain text. The embed description field respects BiDi more reliably.
3. **Code blocks:** Always LTR. Same as all platforms.
4. **Bold/italic:** `**bold**` and `*italic*` — double and single asterisks are both neutral. Same BiDi pairing issues as Slack. Use RLM inside markers.
5. **Reactions/emoji:** Same neutral-character issue as Slack. RLM after emoji before Hebrew continuation.
6. **Spoiler tags:** `||spoiler||` — pipe characters are neutral, same approach as bold markers.

### Before/After Examples

**Problem — embed vs plain message:**
```
Plain message: שלום, אני נירון
Renders left-aligned, character order may be wrong
```
```
Embed description: שלום, אני נירון
Renders with correct character order (still left-aligned, but readable)
```
Prefer embeds for Hebrew-heavy messages in Discord bots.

**Problem — double-asterisk bold in Hebrew:**
```
Before: זה **חשוב** מאוד
Renders as: זה חשוב**** מאוד (markers cluster together)
```
```
After: זה **‏חשוב‏** מאוד
(RLM after opening ** and before closing **)
Renders as: זה **חשוב** מאוד
```

**Problem — spoiler tags:**
```
Before: התשובה היא ||42|| נכון?
Renders as: התשובה היא 42|||| נכון?
```
```
After: התשובה היא ||‏42‏|| נכון?
(RLM after opening || and before closing ||)
Renders as: התשובה היא ||42|| נכון?
```

---

## Quick Reference: Character Codes

| Character | Unicode | HTML Entity | Purpose |
|-----------|---------|-------------|---------|
| RLM | U+200F | `&rlm;` | Force RTL at insertion point |
| LRM | U+200E | `&lrm;` | Force LTR at insertion point |
| RLE | U+202B | — | Start RTL embedding (deprecated, avoid) |
| LRE | U+202A | — | Start LTR embedding (deprecated, avoid) |
| PDF | U+202C | — | Pop direction formatting (deprecated, avoid) |
| RLI | U+2067 | — | Right-to-Left Isolate (modern, preferred for complex cases) |
| LRI | U+2066 | — | Left-to-Right Isolate (modern, preferred for complex cases) |
| PDI | U+2069 | — | Pop Directional Isolate (closes RLI/LRI) |

For most bot messaging use cases, **RLM (U+200F) and LRM (U+200E) are sufficient**. Use RLI/LRI/PDI only for complex nested bidirectional content.
