import {
  startTrace,
  startNode,
  endNode,
  endTrace,
  nodeDurationMs,
  traceDurationMs,
} from "./tracer";

describe("tracer", () => {
  it("starts a trace with a running status and no nodes", () => {
    const trace = startTrace("session-1");
    expect(trace.session_id).toBe("session-1");
    expect(trace.status).toBe("running");
    expect(trace.nodes).toEqual([]);
    expect(trace.id).toBeTruthy();
    expect(trace.started_at).toBeTruthy();
    expect(trace.ended_at).toBeUndefined();
  });

  it("adds a running node to the trace when started", () => {
    const trace = startTrace("session-1");
    const node = startNode(trace, "extractIntent");

    expect(trace.nodes).toHaveLength(1);
    expect(trace.nodes[0]).toBe(node);
    expect(node.name).toBe("extractIntent");
    expect(node.status).toBe("running");
    expect(node.ended_at).toBeUndefined();
  });

  it("completes a node with tokens and duration", () => {
    const trace = startTrace("session-1");
    const node = startNode(trace, "extractIntent");

    endNode(node, { tokens: 120, cost_usd: 0.001 });

    expect(node.status).toBe("completed");
    expect(node.tokens).toBe(120);
    expect(node.cost_usd).toBe(0.001);
    expect(node.ended_at).toBeTruthy();
    expect(nodeDurationMs(node)).toBeGreaterThanOrEqual(0);
  });

  it("marks a node as errored with an error message", () => {
    const trace = startTrace("session-1");
    const node = startNode(trace, "searchFlights");

    endNode(node, { status: "error", error: "timeout" });

    expect(node.status).toBe("error");
    expect(node.error).toBe("timeout");
  });

  it("returns null duration for a node/trace that hasn't ended", () => {
    const trace = startTrace("session-1");
    const node = startNode(trace, "extractIntent");

    expect(nodeDurationMs(node)).toBeNull();
    expect(traceDurationMs(trace)).toBeNull();
  });

  it("completes the trace with a status and computable duration", () => {
    const trace = startTrace("session-1");
    endTrace(trace);

    expect(trace.status).toBe("completed");
    expect(trace.ended_at).toBeTruthy();
    expect(traceDurationMs(trace)).toBeGreaterThanOrEqual(0);
  });

  it("can end a trace with an error status", () => {
    const trace = startTrace("session-1");
    endTrace(trace, "error");
    expect(trace.status).toBe("error");
  });
});
