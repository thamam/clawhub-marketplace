---
name: notebooklm
description: "NotebookLM and Invideo integration for Claw fleet bots. Use when creating audio overviews, research synthesis, video content, or when user mentions 'NotebookLM', 'audio overview', 'podcast', 'notebook', 'video ad', 'Invideo'."
---

# NotebookLM & Invideo Skill

## What NotebookLM Does

NotebookLM is a research and content synthesis tool powered by Google. It can:

- **Audio overviews** -- generate podcast-style conversations between two AI hosts that discuss your uploaded sources in a natural, engaging format
- **Research synthesis** -- combine multiple sources into a unified understanding, surfacing connections and key themes
- **Q&A over sources** -- ask questions grounded in your uploaded documents and get cited answers
- **Study guides** -- auto-generate structured study materials from academic or technical content
- **FAQ generation** -- extract common questions and answers from source material
- **Timelines and briefing docs** -- produce chronological summaries or executive-level briefings

## What It Does NOT Do

- **Cinematic video production** -- for video ads, explainers, or social content, use Invideo (see below)
- **Real-time data** -- NotebookLM works only with uploaded/linked sources, not live feeds
- **Interactive content** -- no quizzes, polls, or clickable outputs
- **Code execution** -- it cannot run code or generate working software artifacts
- **Private/sensitive processing** -- sources are sent to Google servers; do not upload credentials, PII, or confidential business data

## Source Preparation

NotebookLM accepts up to **50 sources** per notebook. Supported formats:

- PDF documents
- Google Docs (linked directly)
- Websites / URLs
- Pasted text (plain or markdown)

**Tips for best results:**

- Keep all sources focused on **one topic** per notebook -- mixing unrelated subjects dilutes quality
- **3-7 sources** is the optimal range for audio overviews -- enough diversity without overwhelming
- Quality over quantity -- one well-written 20-page report beats ten shallow blog posts
- Remove boilerplate, headers/footers, and navigation text from PDFs before uploading
- For websites, prefer article pages over homepages or index pages

## Audio Overview Tips

Audio overviews work best with:

- **Factual and educational content** -- research papers, technical docs, reports, how-to guides
- **Diverse source types** -- mixing a PDF report with a blog post and a data table produces richer conversation than three similar PDFs
- **Specific instructions** -- tell it the target audience, desired tone (casual, academic, journalistic), and which aspects to emphasize
- **Moderate complexity** -- topics that benefit from explanation and discussion, not simple facts

Audio overviews are weaker for:

- Highly subjective or opinion-based content
- Very short source material (not enough to discuss)
- Content requiring visual explanation (charts, diagrams, code walkthroughs)

## Video Content (Invideo)

For video ads, explainers, social clips, and other video content, use the Invideo tool:

```
mcp__claude_ai_Invideo__generate-video-from-script
```

**Writing effective Invideo prompts:**

- **Duration** -- specify target length (e.g., "30-second ad", "2-minute explainer")
- **Visual style** -- describe the aesthetic (minimalist, bold, corporate, playful, cinematic)
- **Text overlays** -- write exact text for titles, subtitles, and call-to-action screens
- **Color palette** -- specify brand colors or mood-based palette (warm tones, dark mode, neon accents)
- **Soundtrack mood** -- describe the audio feel (upbeat electronic, calm ambient, dramatic orchestral)
- **Pacing** -- fast cuts for energy, slow transitions for authority, mixed for storytelling
- **Structure** -- break the script into scenes with visual directions for each

The more specific the prompt, the better the output. Vague prompts produce generic results.

## Output Formats

| Format | Tool | Best For |
|--------|------|----------|
| Audio overview (podcast) | NotebookLM | Educational synthesis, research digests, team updates |
| FAQ document | NotebookLM | Knowledge base articles, onboarding docs |
| Study guide | NotebookLM | Training material, exam prep, technical learning |
| Timeline | NotebookLM | Project history, event sequences, changelog narratives |
| Briefing doc | NotebookLM | Executive summaries, stakeholder updates |
| Video (ad, explainer, social) | Invideo | Marketing, social media, product demos |

## When NOT to Use This Skill

- **Simple factual questions** -- just search the web or ask directly; no need to create a notebook
- **Code generation** -- use the bot's native coding capabilities
- **Real-time data** -- use web search or API integrations
- **Private/sensitive content** -- sources are processed on Google/Invideo servers
- **Quick one-off answers** -- NotebookLM is for multi-source synthesis, not single-question lookups
