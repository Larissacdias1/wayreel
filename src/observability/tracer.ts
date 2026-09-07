// src/observability/tracer.ts
// Source of truth: WAYREEL.md Section 4 (Stack: "custom tracer") and
// Section 6.1 (Trace / TraceNode interfaces, src/domain/types.ts). Duration
// isn't a stored field on either interface — it's derived from
// started_at/ended_at, per the interfaces as frozen.

import type { Trace, TraceNode } from "../domain/types";

export function startTrace(sessionId: string): Trace {
  return {
    id: crypto.randomUUID(),
    session_id: sessionId,
    nodes: [],
    started_at: new Date().toISOString(),
    status: "running",
  };
}

export function startNode(trace: Trace, name: string): TraceNode {
  const node: TraceNode = {
    name,
    started_at: new Date().toISOString(),
    status: "running",
  };
  trace.nodes.push(node);
  return node;
}

export function endNode(
  node: TraceNode,
  options: {
    status?: "completed" | "error";
    error?: string;
    tokens?: number;
    cost_usd?: number;
  } = {},
): void {
  node.ended_at = new Date().toISOString();
  node.status = options.status ?? "completed";
  if (options.error !== undefined) node.error = options.error;
  if (options.tokens !== undefined) node.tokens = options.tokens;
  if (options.cost_usd !== undefined) node.cost_usd = options.cost_usd;
}

export function endTrace(
  trace: Trace,
  status: "completed" | "error" = "completed",
): void {
  trace.ended_at = new Date().toISOString();
  trace.status = status;
}

export function nodeDurationMs(node: TraceNode): number | null {
  if (!node.ended_at) return null;
  return (
    new Date(node.ended_at).getTime() - new Date(node.started_at).getTime()
  );
}

export function traceDurationMs(trace: Trace): number | null {
  if (!trace.ended_at) return null;
  return (
    new Date(trace.ended_at).getTime() - new Date(trace.started_at).getTime()
  );
}
