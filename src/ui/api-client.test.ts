import { sendMessage } from "./api-client";

const flushMicrotasks = () => Promise.resolve().then(() => Promise.resolve());

function createFakeEventSource() {
  const instance: {
    onmessage: ((event: { data: string }) => void) | null;
    onerror: (() => void) | null;
    close: jest.Mock;
  } = {
    onmessage: null,
    onerror: null,
    close: jest.fn(),
  };
  return instance;
}

describe("sendMessage (#142 — POST /api/chat + GET /api/stream via EventSource)", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("POSTs to /api/chat, then resolves with the parsed SSE payload", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, status: 202 } as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    const fakeEventSource = createFakeEventSource();
    const eventSourceFactory = jest.fn().mockReturnValue(fakeEventSource);

    const promise = sendMessage(
      "session-1",
      "hello",
      eventSourceFactory as never,
    );
    await flushMicrotasks();

    expect(fetchMock).toHaveBeenCalledWith("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "hello", session_id: "session-1" }),
    });
    expect(eventSourceFactory).toHaveBeenCalledWith(
      "/api/stream?session_id=session-1",
    );

    const payload = {
      message: { role: "assistant", content: "hi" },
      destinationId: "setenil",
      flights: [],
      error: null,
      clarificationNeeded: false,
    };
    fakeEventSource.onmessage?.({ data: JSON.stringify(payload) });

    await expect(promise).resolves.toEqual(payload);
    expect(fakeEventSource.close).toHaveBeenCalledTimes(1);
  });

  it("rejects when POST /api/chat fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as Response) as unknown as typeof fetch;

    await expect(sendMessage("session-1", "hello")).rejects.toThrow(
      "POST /api/chat failed with status 500",
    );
  });

  it("rejects when the EventSource connection errors", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 202,
    } as Response) as unknown as typeof fetch;

    const fakeEventSource = createFakeEventSource();
    const eventSourceFactory = jest.fn().mockReturnValue(fakeEventSource);

    const promise = sendMessage(
      "session-1",
      "hello",
      eventSourceFactory as never,
    );
    await flushMicrotasks();
    fakeEventSource.onerror?.();

    await expect(promise).rejects.toThrow("GET /api/stream connection error");
    expect(fakeEventSource.close).toHaveBeenCalledTimes(1);
  });
});
