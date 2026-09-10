import {
  buildGraph,
  shouldClarify,
  hasRecommendation,
  shouldAlternative,
} from "./graph";
import { createInitialState } from "./state";

describe("shouldClarify (WAYREEL.md Section 8.3)", () => {
  it("routes to buildResponse when there is an error", () => {
    const state = createInitialState("s1");
    state.error = "jailbreak_detected";
    expect(shouldClarify(state)).toBe("buildResponse");
  });

  it("routes to clarify when clarification is needed", () => {
    const state = createInitialState("s2");
    state.clarification_needed = true;
    expect(shouldClarify(state)).toBe("clarify");
  });

  it("routes to retrieveContext otherwise", () => {
    const state = createInitialState("s3");
    expect(shouldClarify(state)).toBe("retrieveContext");
  });
});

describe("hasRecommendation (WAYREEL.md Section 8.3)", () => {
  it("routes to buildResponse when there is an error", () => {
    const state = createInitialState("s1");
    state.error = "invalid_recommendation_destination";
    expect(hasRecommendation(state)).toBe("buildResponse");
  });

  it("routes to clarify when confidence is below 0.6", () => {
    const state = createInitialState("s2");
    state.recommendation = {
      destination_id: "setenil",
      confidence: 0.4,
      reason: "x",
      caveats: [],
    };
    expect(hasRecommendation(state)).toBe("clarify");
  });

  // Exact boundary (WAYREEL.md Section 8.3 line: "confidence < 0.6" — a
  // strict less-than, so 0.6 itself is NOT below the threshold and must be
  // accepted). Paired with the 0.59 case right below so the boundary is
  // unambiguous: neither 0.61 nor "close to 0.6" — exactly 0.6 vs exactly
  // 0.59, one on each side of the strict "<" in the source code.
  it("routes to clarify when confidence is exactly 0.59 (just below the threshold)", () => {
    const state = createInitialState("s2b");
    state.recommendation = {
      destination_id: "setenil",
      confidence: 0.59,
      reason: "x",
      caveats: [],
    };
    expect(hasRecommendation(state)).toBe("clarify");
  });

  it("routes to searchFlights when confidence is exactly 0.6 (the DoD's '>= 0.6' boundary — accepted, not clarified)", () => {
    const state = createInitialState("s3");
    state.recommendation = {
      destination_id: "setenil",
      confidence: 0.6,
      reason: "x",
      caveats: [],
    };
    expect(hasRecommendation(state)).toBe("searchFlights");
  });
});

describe("shouldAlternative (WAYREEL.md Section 8.3 — #126 DoD: ALTERNATIVE)", () => {
  it("routes to recommendAlternative when experience_state is 'alternative'", () => {
    const state = createInitialState("s1");
    state.experience_state = {
      type: "alternative",
      destinationId: "mardin",
      previousId: "setenil",
    };
    expect(shouldAlternative(state)).toBe("recommendAlternative");
  });

  it("routes to recommendDestination otherwise", () => {
    const state = createInitialState("s2");
    expect(shouldAlternative(state)).toBe("recommendDestination");
  });
});

describe("buildGraph", () => {
  it("compiles without throwing, with all nodes and edges wired", () => {
    expect(() => buildGraph()).not.toThrow();
  });
});
