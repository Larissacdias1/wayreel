// Per ADR-035: the agent graph calls the real Gemini API, so it is mocked
// here to keep this permanent Jest suite deterministic and network-free.
// Route/middleware behavior (validation, rate limiting, CORS, SSE) is what
// is under test, not the graph's own logic (already covered in
// src/agent/graph.test.ts and src/agent/nodes.test.ts).

import request from "supertest";

jest.mock("../agent/graph", () => ({
  buildGraph: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { buildGraph } = require("../agent/graph");
const invokeMock = jest.fn();
buildGraph.mockReturnValue({ invoke: invokeMock });

// eslint-disable-next-line @typescript-eslint/no-var-requires
const indexModule = require("./index");
const app = indexModule.default;
const { __resetStateForTests } = indexModule;

beforeEach(() => {
  __resetStateForTests();
});

const SESSION_ID = "11111111-1111-4111-8111-111111111111";

describe("GET /health", () => {
  it("returns 200 ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("POST /api/chat", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("rejects an invalid body", async () => {
    const res = await request(app).post("/api/chat").send({ message: "" });
    expect(res.status).toBe(400);
  });

  it("accepts a valid body, invokes the graph, and returns 202", async () => {
    invokeMock.mockResolvedValue({
      session_id: SESSION_ID,
      messages: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "hello back" },
      ],
    });

    const res = await request(app)
      .post("/api/chat")
      .send({ message: "hi", session_id: SESSION_ID });

    expect(res.status).toBe(202);
    expect(res.body.session_id).toBe(SESSION_ID);
    expect(invokeMock).toHaveBeenCalledTimes(1);
  });

  it("sets a CORS header allowing the Vite dev origin", async () => {
    invokeMock.mockResolvedValue({
      session_id: SESSION_ID,
      messages: [{ role: "assistant", content: "ok" }],
    });

    const res = await request(app)
      .post("/api/chat")
      .send({ message: "hi", session_id: SESSION_ID });

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
  });

  it("rate-limits a session after 30 requests in the same hour (docs/SECURITY.md Section 3)", async () => {
    invokeMock.mockResolvedValue({
      session_id: SESSION_ID,
      messages: [{ role: "assistant", content: "ok" }],
    });

    const sessionId = "22222222-2222-4222-8222-222222222222";
    let lastStatus = 0;
    for (let i = 0; i < 31; i++) {
      const res = await request(app)
        .post("/api/chat")
        .send({ message: "hi", session_id: sessionId });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});

describe("GET /api/stream", () => {
  it("streams the final message for a session with a stored result", async () => {
    invokeMock.mockResolvedValue({
      session_id: SESSION_ID,
      messages: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "final message" },
      ],
    });

    await request(app)
      .post("/api/chat")
      .send({ message: "hi", session_id: SESSION_ID });

    const res = await request(app).get(`/api/stream?session_id=${SESSION_ID}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/event-stream");
    expect(res.text).toContain("final message");
  });

  it("returns 404 for a session_id that was never POSTed", async () => {
    const res = await request(app).get(
      "/api/stream?session_id=99999999-9999-9999-9999-999999999999",
    );

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Unknown session_id" });
  });

  it("returns an SSE 'processing' event while the POST is still running", async () => {
    let resolveInvoke!: (value: unknown) => void;
    let signalInvokeCalled!: () => void;
    const invokeCalled = new Promise<void>((resolve) => {
      signalInvokeCalled = resolve;
    });
    invokeMock.mockImplementation(() => {
      signalInvokeCalled();
      return new Promise((resolve) => {
        resolveInvoke = resolve;
      });
    });

    const postPromise = request(app)
      .post("/api/chat")
      .send({ message: "hi", session_id: SESSION_ID });
    // supertest doesn't dispatch the request until it's awaited/then'd —
    // kick it off now so it runs concurrently with the stream check below.
    void postPromise.then(() => {});

    // Wait until the handler has actually called the (mocked) graph — it
    // marks the session as pending before that call, so this guarantees
    // the stream request below observes the "processing" state instead of
    // racing against the POST handler's own dispatch.
    await invokeCalled;

    const streamRes = await request(app).get(
      `/api/stream?session_id=${SESSION_ID}`,
    );

    expect(streamRes.status).toBe(200);
    expect(streamRes.headers["content-type"]).toContain("text/event-stream");
    expect(streamRes.text).toContain('"status":"processing"');

    resolveInvoke({
      session_id: SESSION_ID,
      messages: [{ role: "assistant", content: "done" }],
    });
    await postPromise;
  });
});
