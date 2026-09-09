import { createInitialState } from "./state";

describe("createInitialState", () => {
  it("builds a complete initial AgentState for a given session", () => {
    const state = createInitialState("session-1");

    expect(state).toEqual({
      session_id: "session-1",
      messages: [],
      intent: null,
      clarification_needed: false,
      clarification_question: null,
      retrieved_destinations: [],
      recommendation: null,
      rejected_destinations: [],
      flights: [],
      experience_state: { type: "conversation" },
      error: null,
    });
  });

  it("starts rejected_destinations as an empty array (for the alternative fallback)", () => {
    const state = createInitialState("session-2");
    expect(state.rejected_destinations).toEqual([]);
  });

  it("uses a distinct session_id per call", () => {
    const a = createInitialState("session-a");
    const b = createInitialState("session-b");
    expect(a.session_id).toBe("session-a");
    expect(b.session_id).toBe("session-b");
  });
});
