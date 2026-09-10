// src/api/index.ts
// Source of truth: WAYREEL.md Section 2 (architecture: "SSE /api/chat"),
// Section 4 (Express 4 + TypeScript, SSE), Section 5 ("api/ → Express
// server, routes, SSE endpoint"). Issue #127 title says "api/server.ts",
// but the existing "server" npm script (package.json, Sprint 0) already
// points to src/api/index.ts — kept that filename rather than the issue
// title, which is imprecise (same pattern as other loosely-worded DoDs).
//
// [DECISION REQUIRED resolved with user input, #127] WAYREEL.md's
// architecture diagram only shows a single "SSE /api/chat" flow, but this
// issue's DoD asks for two routes: POST /api/chat and GET /api/stream.
// Browser EventSource (the standard SSE client) only supports GET, so the
// two-route split is the standard way to combine SSE with a POST payload:
// POST runs the agent graph and buffers the result in memory, GET opens the
// actual SSE connection and streams that buffered result. No incremental
// per-node progress is streamed — WAYREEL.md never documents that, only
// the final message.
//
// CORS and rate limiting (DoD) are implemented with plain Express
// middleware, no new dependency — neither `cors` nor `express-rate-limit`
// is listed in WAYREEL.md Section 4's stack table.

import express from "express";
import type { Request, Response, NextFunction } from "express";
import { UserMessageSchema } from "../domain/schemas";
import { buildGraph } from "../agent/graph";
import { createInitialState } from "../agent/state";
import type { AgentState } from "../agent/state";

const PORT = Number(process.env.PORT) || 3000;
const FRONTEND_ORIGIN = "http://localhost:5173"; // Vite dev server (WAYREEL.md Section 4)

const app = express();
app.use(express.json());

// [TODO] Update allowed origin before deploy (#150) — currently hardcoded to localhost:5173 for dev only.
// CORS — only the frontend's own origin, not a wildcard.
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// docs/SECURITY.md Section 3: "Requests to the chat endpoint | 10/min | IP +
// session" and "Requests per session | 30/hour | Session ID".
const CHAT_RATE_LIMIT_PER_MINUTE = 10;
const SESSION_RATE_LIMIT_PER_HOUR = 30;
const ipRequestLog = new Map<string, number[]>();
const sessionRequestLog = new Map<string, number[]>();

function isRateLimited(
  log: Map<string, number[]>,
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const timestamps = (log.get(key) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  log.set(key, timestamps);
  return timestamps.length > limit;
}

// [KNOWN LIMITATION] No session expiry/cleanup — acceptable for MVP demo scope, revisit if this runs long-lived in production.
// In-memory session store: POST /api/chat runs the graph and buffers the
// result here; GET /api/stream reads it back and streams it via SSE.
const sessionResults = new Map<string, AgentState>();

// Tracks session_ids that have been accepted by POST /api/chat but whose
// graph run hasn't finished yet, so GET /api/stream can tell "processing"
// (this session exists, wait) apart from "unknown" (this session_id was
// never POSTed — a 404, not a stream event).
const pendingSessions = new Set<string>();

let graph: ReturnType<typeof buildGraph> | null = null;
function getGraph(): ReturnType<typeof buildGraph> {
  if (!graph) {
    graph = buildGraph();
  }
  return graph;
}

app.post("/api/chat", async (req: Request, res: Response) => {
  const parsed = UserMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { message, session_id } = parsed.data;

  if (
    isRateLimited(
      ipRequestLog,
      req.ip ?? "unknown",
      CHAT_RATE_LIMIT_PER_MINUTE,
      60_000,
    ) ||
    isRateLimited(
      sessionRequestLog,
      session_id,
      SESSION_RATE_LIMIT_PER_HOUR,
      60 * 60_000,
    )
  ) {
    res.status(429).json({ error: "Rate limit exceeded" });
    return;
  }

  const state =
    sessionResults.get(session_id) ?? createInitialState(session_id);
  state.messages.push({ role: "user", content: message });

  pendingSessions.add(session_id);
  try {
    const result = await getGraph().invoke(state);
    sessionResults.set(session_id, result as AgentState);
  } finally {
    pendingSessions.delete(session_id);
  }

  res.status(202).json({ status: "processing", session_id });
});

app.get("/api/stream", (req: Request, res: Response) => {
  const sessionId = String(req.query.session_id ?? "");
  const state = sessionResults.get(sessionId);

  if (!state) {
    if (pendingSessions.has(sessionId)) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.write(`data: ${JSON.stringify({ status: "processing" })}\n\n`);
      res.end();
      return;
    }
    res.status(404).json({ error: "Unknown session_id" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const lastMessage = state.messages[state.messages.length - 1];
  res.write(`data: ${JSON.stringify(lastMessage)}\n\n`);
  res.end();
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Test-only reset, mirroring src/mcp/flight-tool.ts's
// __resetCircuitBreakerForTests() pattern — keeps rate-limit and session
// state isolated between test cases.
export function __resetStateForTests(): void {
  ipRequestLog.clear();
  sessionRequestLog.clear();
  sessionResults.clear();
  pendingSessions.clear();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`Wayreel API listening on port ${PORT}`);
  });
}

export default app;
