import {
  createExperienceReducer,
  initialExperienceScene,
  type ExperienceScene,
} from "./experience-state";

const reducer = createExperienceReducer(false);
const reducedMotionReducer = createExperienceReducer(true);

describe("experienceReducer (WAYREEL.md Section 7)", () => {
  it("starts at IDLE", () => {
    expect(initialExperienceScene).toEqual({ type: "IDLE" });
  });

  it("IDLE --START--> CHATTING", () => {
    expect(reducer({ type: "IDLE" }, { type: "START" })).toEqual({
      type: "CHATTING",
    });
  });

  it("CHATTING --MESSAGE_SENT--> THINKING", () => {
    expect(reducer({ type: "CHATTING" }, { type: "MESSAGE_SENT" })).toEqual({
      type: "THINKING",
      timedOut: false,
    });
  });

  it("THINKING --THINKING_TIMEOUT--> THINKING (timedOut: true), 'try again' fallback (rule 4)", () => {
    expect(
      reducer(
        { type: "THINKING", timedOut: false },
        { type: "THINKING_TIMEOUT" },
      ),
    ).toEqual({ type: "THINKING", timedOut: true });
  });

  it("THINKING (timedOut) --RETRY--> CHATTING", () => {
    expect(
      reducer({ type: "THINKING", timedOut: true }, { type: "RETRY" }),
    ).toEqual({ type: "CHATTING" });
  });

  it("THINKING --DESTINATION_DECIDED--> FLYTHROUGH", () => {
    expect(
      reducer(
        { type: "THINKING", timedOut: false },
        { type: "DESTINATION_DECIDED", destinationId: "setenil" },
      ),
    ).toEqual({ type: "FLYTHROUGH", destinationId: "setenil" });
  });

  it("Section 11.3: reduced motion — THINKING --DESTINATION_DECIDED--> REVEAL directly, skipping FLYTHROUGH", () => {
    expect(
      reducedMotionReducer(
        { type: "THINKING", timedOut: false },
        { type: "DESTINATION_DECIDED", destinationId: "setenil" },
      ),
    ).toEqual({ type: "REVEAL", destinationId: "setenil" });
  });

  it("FLYTHROUGH --FLYTHROUGH_SKIPPED--> REVEAL", () => {
    expect(
      reducer(
        { type: "FLYTHROUGH", destinationId: "setenil" },
        { type: "FLYTHROUGH_SKIPPED" },
      ),
    ).toEqual({ type: "REVEAL", destinationId: "setenil" });
  });

  it("FLYTHROUGH --FLYTHROUGH_COMPLETE--> REVEAL", () => {
    expect(
      reducer(
        { type: "FLYTHROUGH", destinationId: "setenil" },
        { type: "FLYTHROUGH_COMPLETE" },
      ),
    ).toEqual({ type: "REVEAL", destinationId: "setenil" });
  });

  it("REVEAL --REJECT_DESTINATION--> ALTERNATIVE", () => {
    expect(
      reducer(
        { type: "REVEAL", destinationId: "setenil" },
        { type: "REJECT_DESTINATION" },
      ),
    ).toEqual({ type: "ALTERNATIVE", previousDestinationId: "setenil" });
  });

  it("REVEAL --SCROLL_TO_OPTIONS--> OPTIONS", () => {
    expect(
      reducer(
        { type: "REVEAL", destinationId: "setenil" },
        { type: "SCROLL_TO_OPTIONS" },
      ),
    ).toEqual({ type: "OPTIONS", destinationId: "setenil" });
  });

  it("ALTERNATIVE --ALTERNATIVE_READY--> FLYTHROUGH (new destination)", () => {
    expect(
      reducer(
        { type: "ALTERNATIVE", previousDestinationId: "setenil" },
        { type: "ALTERNATIVE_READY", destinationId: "mardin" },
      ),
    ).toEqual({ type: "FLYTHROUGH", destinationId: "mardin" });
  });

  it("Section 11.3: reduced motion — ALTERNATIVE --ALTERNATIVE_READY--> REVEAL directly", () => {
    expect(
      reducedMotionReducer(
        { type: "ALTERNATIVE", previousDestinationId: "setenil" },
        { type: "ALTERNATIVE_READY", destinationId: "mardin" },
      ),
    ).toEqual({ type: "REVEAL", destinationId: "mardin" });
  });

  it("OPTIONS --SCROLL_TO_CTA--> CTA", () => {
    expect(
      reducer(
        { type: "OPTIONS", destinationId: "setenil" },
        { type: "SCROLL_TO_CTA" },
      ),
    ).toEqual({ type: "CTA", destinationId: "setenil" });
  });

  it("CTA --NEW_SEARCH--> CHATTING", () => {
    expect(
      reducer(
        { type: "CTA", destinationId: "setenil" },
        { type: "NEW_SEARCH" },
      ),
    ).toEqual({ type: "CHATTING" });
  });

  it("ignores events that don't apply to the current state", () => {
    // NEW_SEARCH is only valid from CTA, so it's a safe "irrelevant event"
    // probe for every other state; CTA is probed with START instead (only
    // valid from IDLE).
    const statesWhereNewSearchIsIrrelevant: ExperienceScene[] = [
      { type: "IDLE" },
      { type: "CHATTING" },
      { type: "THINKING", timedOut: false },
      { type: "FLYTHROUGH", destinationId: "setenil" },
      { type: "REVEAL", destinationId: "setenil" },
      { type: "ALTERNATIVE", previousDestinationId: "setenil" },
      { type: "OPTIONS", destinationId: "setenil" },
    ];

    for (const state of statesWhereNewSearchIsIrrelevant) {
      expect(reducer(state, { type: "NEW_SEARCH" })).toEqual(state);
    }

    const ctaState: ExperienceScene = {
      type: "CTA",
      destinationId: "setenil",
    };
    expect(reducer(ctaState, { type: "START" })).toEqual(ctaState);
  });
});
