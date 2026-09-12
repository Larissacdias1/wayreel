// src/ui/experience-state.ts
// Source of truth: WAYREEL.md Section 7 (Experience State Machine, 8 scenes)
// and Section 11.3 (prefers-reduced-motion: "skips straight to REVEAL with
// static cards"). Extracted from ui/App.tsx into its own pure, dependency-free
// module so the state machine's transitions can be unit-tested with plain
// Jest — no new test dependency (no jsdom/@testing-library/react configured
// in this project yet), consistent with the Section 2 golden rule ("if a
// clear deterministic rule exists, do not use an LLM" — and by the same
// logic, don't reach for browser-rendering tests where pure logic suffices).
//
// The "try again" fallback on a THINKING timeout (Section 7, rule 4) is not
// one of the 8 named scenes — modeled as a flag on THINKING itself, keeping
// exactly 8 discriminated scene types, matching the DoD ("8 states").

export type ExperienceScene =
  | { type: "IDLE" }
  | { type: "CHATTING" }
  | { type: "THINKING"; timedOut: boolean }
  | { type: "FLYTHROUGH"; destinationId: string }
  | { type: "REVEAL"; destinationId: string }
  | { type: "ALTERNATIVE"; previousDestinationId: string }
  | { type: "OPTIONS"; destinationId: string }
  | { type: "CTA"; destinationId: string };

export type ExperienceEvent =
  | { type: "START" }
  | { type: "MESSAGE_SENT" }
  | { type: "THINKING_TIMEOUT" }
  | { type: "RETRY" }
  | { type: "DESTINATION_DECIDED"; destinationId: string }
  | { type: "FLYTHROUGH_SKIPPED" }
  | { type: "FLYTHROUGH_COMPLETE" }
  | { type: "REJECT_DESTINATION" }
  | { type: "ALTERNATIVE_READY"; destinationId: string }
  | { type: "SCROLL_TO_OPTIONS" }
  | { type: "SCROLL_TO_CTA" }
  | { type: "NEW_SEARCH" };

export const initialExperienceScene: ExperienceScene = { type: "IDLE" };

// reducedMotion is curried in, rather than carried on state/events, since it
// only affects two transitions (both would-be entries into FLYTHROUGH) and
// doesn't change during the component's lifetime the way scene data does.
export function createExperienceReducer(reducedMotion: boolean) {
  return function experienceReducer(
    state: ExperienceScene,
    event: ExperienceEvent,
  ): ExperienceScene {
    switch (state.type) {
      case "IDLE":
        if (event.type === "START") return { type: "CHATTING" };
        return state;

      case "CHATTING":
        if (event.type === "MESSAGE_SENT")
          return { type: "THINKING", timedOut: false };
        return state;

      case "THINKING":
        if (event.type === "THINKING_TIMEOUT")
          return { type: "THINKING", timedOut: true };
        if (event.type === "RETRY") return { type: "CHATTING" };
        if (event.type === "DESTINATION_DECIDED") {
          // Section 11.3 — reduced motion skips the entire flythrough scene.
          return reducedMotion
            ? { type: "REVEAL", destinationId: event.destinationId }
            : { type: "FLYTHROUGH", destinationId: event.destinationId };
        }
        return state;

      case "FLYTHROUGH":
        if (
          event.type === "FLYTHROUGH_SKIPPED" ||
          event.type === "FLYTHROUGH_COMPLETE"
        ) {
          return { type: "REVEAL", destinationId: state.destinationId };
        }
        return state;

      case "REVEAL":
        if (event.type === "REJECT_DESTINATION") {
          return {
            type: "ALTERNATIVE",
            previousDestinationId: state.destinationId,
          };
        }
        if (event.type === "SCROLL_TO_OPTIONS") {
          return { type: "OPTIONS", destinationId: state.destinationId };
        }
        return state;

      case "ALTERNATIVE":
        if (event.type === "ALTERNATIVE_READY") {
          // Section 11.3 applies here too — reduced motion still skips the
          // flythrough even for the alternative destination.
          return reducedMotion
            ? { type: "REVEAL", destinationId: event.destinationId }
            : { type: "FLYTHROUGH", destinationId: event.destinationId };
        }
        return state;

      case "OPTIONS":
        if (event.type === "SCROLL_TO_CTA") {
          return { type: "CTA", destinationId: state.destinationId };
        }
        return state;

      case "CTA":
        if (event.type === "NEW_SEARCH") return { type: "CHATTING" };
        return state;

      default:
        return state;
    }
  };
}
