// src/ui/App.tsx
// Source of truth: WAYREEL.md Section 7 (Experience State Machine).
// State machine logic lives in ./experience-state.ts (kept pure/testable,
// see that file's header comment for why). This component only wires it up
// and renders a scene per state.
//
// Chat/Flythrough/TravelOptions (issues #138-140) and the real API wiring
// via SSE (#142) don't exist yet — each scene below is a minimal
// placeholder until those issues land; this issue's DoD is the state
// machine itself ("Complete state machine (8 states), correct
// transitions"), not the final visual content.

import { useReducer } from "react";
import {
  createExperienceReducer,
  initialExperienceScene,
} from "./experience-state";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

export default function App() {
  const reducedMotion = usePrefersReducedMotion();
  const [scene, dispatch] = useReducer(
    createExperienceReducer(reducedMotion),
    initialExperienceScene,
  );

  switch (scene.type) {
    case "IDLE":
      return (
        <div data-scene="IDLE">
          <button onClick={() => dispatch({ type: "START" })}>Start</button>
        </div>
      );

    case "CHATTING":
      return (
        <div data-scene="CHATTING">
          <button onClick={() => dispatch({ type: "MESSAGE_SENT" })}>
            Send message
          </button>
        </div>
      );

    case "THINKING":
      return (
        <div data-scene="THINKING">
          {scene.timedOut ? (
            <button onClick={() => dispatch({ type: "RETRY" })}>
              Try again
            </button>
          ) : (
            <button
              onClick={() =>
                dispatch({
                  type: "DESTINATION_DECIDED",
                  destinationId: "setenil",
                })
              }
            >
              (placeholder) Destination decided
            </button>
          )}
        </div>
      );

    case "FLYTHROUGH":
      return (
        <div data-scene="FLYTHROUGH">
          <button onClick={() => dispatch({ type: "FLYTHROUGH_SKIPPED" })}>
            Skip
          </button>
        </div>
      );

    case "REVEAL":
      return (
        <div data-scene="REVEAL">
          <button onClick={() => dispatch({ type: "REJECT_DESTINATION" })}>
            I don&apos;t like it, show another
          </button>
          <button onClick={() => dispatch({ type: "SCROLL_TO_OPTIONS" })}>
            Continue
          </button>
        </div>
      );

    case "ALTERNATIVE":
      return (
        <div data-scene="ALTERNATIVE">
          <button
            onClick={() =>
              dispatch({ type: "ALTERNATIVE_READY", destinationId: "mardin" })
            }
          >
            (placeholder) Alternative ready
          </button>
        </div>
      );

    case "OPTIONS":
      return (
        <div data-scene="OPTIONS">
          <button onClick={() => dispatch({ type: "SCROLL_TO_CTA" })}>
            Continue
          </button>
        </div>
      );

    case "CTA":
      return (
        <div data-scene="CTA">
          <button onClick={() => dispatch({ type: "NEW_SEARCH" })}>
            New search
          </button>
        </div>
      );
  }
}
