---
name: web-search
description: "Web search decision framework for Claw fleet bots. Use when a bot needs to decide whether to search, how to present results, cite sources, handle rate limits. Trigger on 'search the web', 'look up', 'find online', 'research this'."
---

# /web-search

Decision framework for web search. This is NOT an API wrapper -- it guides when and how to search.

## 1. Should I Search?

Run this decision tree before making any search call:

```
Is the answer already in my memory / workspace files?
  YES --> Use memory. Do not search.
  NO  --> Continue.

Is this a time-sensitive question? (news, prices, weather, "latest", "current")
  YES --> Search. Memory is likely stale.
  NO  --> Continue.

Is this a factual question with a definitive answer?
  YES --> Search if confidence < 90%. State facts without hedging.
  NO  --> Continue.

Is the user asking for my opinion or analysis?
  YES --> Do not search. Use your own reasoning. Say so.
  NO  --> Continue.

Is this about an internal team project, person, or decision?
  YES --> Check memory first. Internal info is rarely on the web.
  NO  --> Search.
```

**Default:** When in doubt, search. A redundant search costs less than a wrong answer.

## 2. Which Provider?

| Provider | Best for | Result quality | Speed |
|----------|----------|---------------|-------|
| **Tavily** | Quick facts, summaries, recent news | High (AI-extracted answers) | Fast (~2s) |
| **Firecrawl** | Deep page scraping, structured data extraction | High (full page content) | Slow (~5-10s) |
| **Direct URL fetch** | Known source, specific page, documentation | Exact (no search noise) | Fast (~1s) |

**Decision:**
- User gave a URL --> direct fetch
- Need a quick factual answer --> Tavily
- Need to read a full article or extract structured data --> Firecrawl
- No provider available --> say "I don't have web search configured" (do not hallucinate results)

## 3. How Many Results?

| Scenario | Results | Why |
|----------|---------|-----|
| Quick fact ("what is X") | 3 | First reliable hit is enough |
| Research ("compare X and Y") | 5-10 | Need multiple perspectives |
| Known URL | 1 | Already know the source |
| Verification ("is this true") | 3-5 | Need consensus across sources |

Never request more than 10 results. Diminishing returns after that.

## 4. How to Present Results

### Always:
- **Summarize in your own words.** Do not paste raw search snippets.
- **Cite the source URL** for every factual claim. Format: `[source](url)` or inline "(source: url)".
- **Indicate confidence level:**
  - High: multiple sources agree, authoritative source found
  - Medium: one good source, or sources partially agree
  - Low: conflicting sources, or only found tangential info
- **Flag contradictions.** If sources disagree, say so explicitly: "Source A says X, but Source B says Y."

### Never:
- Present search results as your own knowledge without citation
- Silently drop results that contradict your initial answer
- Combine facts from different sources into a single unsourced claim

### Format by context:
- **Quick answer in chat:** 1-2 sentences + source link
- **Research summary:** Bullet points with inline citations
- **Detailed report:** Sections with multiple sources per claim

## 5. When to Stop

- **Same query, no new results:** If a second search for the same (or rephrased) query returns the same results, stop. You have exhausted the available information.
- **Two searches, no answer:** If two different search queries don't answer the question, say: "I searched for [X] and [Y] but couldn't find a reliable answer." Do not keep searching.
- **Source quality too low:** If all results are forums, SEO spam, or unverifiable blogs, say: "I found some results but none from authoritative sources. Take this with caution: [summary]."
- **User said stop:** Respect "never mind", "forget it", "I'll look it up myself."

## 6. Language Handling

### Hebrew queries:
1. Translate the query to English for search (most search providers return better English results)
2. Run the search in English
3. Translate the results back to Hebrew for the user
4. Indicate that you translated: "I searched in English and translated the results"
5. Keep proper nouns, brand names, and technical terms in their original language

### English queries:
- Search in English directly
- Present results in the conversation's language

### Mixed queries:
- Extract the factual question, search in English
- Present in whatever language the user is using

## 7. Rate Limits and Caching

- **Do not search the same query twice in one session.** If you already searched "X", reference your earlier results.
- **Respect provider limits.** Tavily free tier: 1000 searches/month. If approaching the limit, prefer memory over search.
- **Batch related queries.** If the user asks 3 related questions, try to answer them with one broad search rather than 3 narrow ones.
- **No preemptive searching.** Do not search "just in case" before the user asks. Search only when needed.
- **Cache window:** Treat search results as valid for the current session. For facts that change hourly (stocks, weather), re-search if asked again after significant time.
