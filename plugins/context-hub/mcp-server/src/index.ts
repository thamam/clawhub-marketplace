#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

const CHUB_TIMEOUT = 15_000;
const MAX_OUTPUT = 100 * 1024;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function chub(
  args: string[],
  json = true
): Promise<string> {
  const fullArgs = json ? [...args, "--json"] : args;
  try {
    const { stdout } = await exec("chub", fullArgs, {
      timeout: CHUB_TIMEOUT,
      maxBuffer: MAX_OUTPUT,
      env: { ...process.env, NO_COLOR: "1" },
    });
    return stdout.trim();
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : String(err);
    throw new Error(`chub ${args[0]} failed: ${msg}`);
  }
}

function text(content: string) {
  return { content: [{ type: "text" as const, text: content }] };
}

function error(msg: string) {
  return { content: [{ type: "text" as const, text: msg }], isError: true };
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new McpServer(
  { name: "context-hub", version: "1.0.0" },
  {
    instructions:
      "Context Hub — search and fetch fleet docs, skills, decisions, and patterns. " +
      "Start with chub_search to discover entries, then chub_get to fetch content.",
  }
);

// ---------------------------------------------------------------------------
// Tool 1: chub_search — discovery + search (read-only, lightweight)
// ---------------------------------------------------------------------------

server.tool(
  "chub_search",
  "Search Context Hub for docs, skills, decisions, or patterns. Returns IDs and summaries.",
  {
    query: z
      .string()
      .optional()
      .describe("Search term. Omit to list all entries."),
    tags: z
      .string()
      .optional()
      .describe("Comma-separated tag filter (e.g. fleet,decisions)"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Max results (default 20)"),
  },
  async ({ query, tags, limit }) => {
    try {
      const args = ["search"];
      if (query) args.push(query);
      if (tags) args.push("--tags", tags);
      if (limit) args.push("--limit", String(limit));
      const out = await chub(args);
      return text(out);
    } catch (e) {
      return error(String(e));
    }
  }
);

// ---------------------------------------------------------------------------
// Tool 2: chub_get — fetch full content by ID (read-only)
// ---------------------------------------------------------------------------

server.tool(
  "chub_get",
  "Fetch full content of a doc or skill by ID. Use IDs from chub_search results.",
  {
    id: z.string().describe("Entry ID (e.g. neuronbox/fleet-context)"),
    lang: z
      .string()
      .optional()
      .describe("Language variant: py, js, ts, rb, cs"),
    version: z.string().optional().describe("Specific version"),
    file: z
      .string()
      .optional()
      .describe("Fetch specific file within the entry"),
  },
  async ({ id, lang, version, file }) => {
    try {
      const args = ["get", id];
      if (lang) args.push("--lang", lang);
      if (version) args.push("--version", version);
      if (file) args.push("--file", file);
      const out = await chub(args, false);
      return text(out);
    } catch (e) {
      return error(String(e));
    }
  }
);

// ---------------------------------------------------------------------------
// Tool 3: chub_annotate — add/read agent notes (write)
// ---------------------------------------------------------------------------

server.tool(
  "chub_annotate",
  "Add, read, or list agent notes on Context Hub entries. Notes persist locally across sessions.",
  {
    id: z.string().optional().describe("Entry ID to annotate"),
    note: z.string().optional().describe("Note text to save. Omit to read existing note."),
    clear: z
      .boolean()
      .optional()
      .describe("Remove annotation for this entry"),
    list: z
      .boolean()
      .optional()
      .describe("List all saved annotations"),
  },
  async ({ id, note, clear, list }) => {
    try {
      const args = ["annotate"];
      if (list) {
        args.push("--list");
      } else {
        if (!id) return error("id is required unless using list=true");
        args.push(id);
        if (note) args.push(note);
        if (clear) args.push("--clear");
      }
      const out = await chub(args);
      return text(out);
    } catch (e) {
      return error(String(e));
    }
  }
);

// ---------------------------------------------------------------------------
// Resource: registry overview (zero tool-token cost)
// ---------------------------------------------------------------------------

server.resource(
  "registry",
  "chub://registry",
  {
    description: "Context Hub registry — all available docs and skills",
    mimeType: "application/json",
  },
  async (uri) => {
    const out = await chub(["search", "--limit", "500"]);
    return { contents: [{ uri: uri.href, text: out, mimeType: "application/json" }] };
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("context-hub MCP failed to start:", err);
  process.exit(1);
});
