// src/ui/App.tsx
// Source of truth: WAYREEL.md Section 7 (Experience State Machine).
// State machine logic lives in ./experience-state.ts (kept pure/testable,
// see that file's header comment for why). This component wires it up,
// renders a scene per state, and (since #142) drives CHATTING/THINKING with
// the real POST /api/chat + GET /api/stream (SSE) flow via ./api-client.ts.
//
// #142 scope: the message-send/receive loop (CHATTING <-> THINKING) is
// wired to the real API, and FLYTHROUGH/OPTIONS render with the real
// destinationId/flights carried in from that response. Rejecting a
// destination (ALTERNATIVE) is NOT wired to a real API call here — the
// current POST /api/chat has no way to pass rejected_destinations at all
// (no such request field exists), which is a separate gap this issue's DoD
// ("Consumes /api/stream, updates state by event") doesn't cover; the
// ALTERNATIVE scene keeps its #137 placeholder button.

import { useReducer, useState } from "react";
import {
  createExperienceReducer,
  initialExperienceScene,
} from "./experience-state";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";
import Thinking from "./Thinking";
import Chat, { type ChatMessage } from "./Chat";
import Flythrough from "./Flythrough";
import TravelOptions from "./TravelOptions";
import { sendMessage } from "./api-client";
import type { FlightOption } from "../domain/types";

export default function App() {
  const reducedMotion = usePrefersReducedMotion();
  const [scene, dispatch] = useReducer(
    createExperienceReducer(reducedMotion),
    initialExperienceScene,
  );
  const [sessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [flights, setFlights] = useState<FlightOption[]>([]);

  async function handleSendMessage(text: string) {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    dispatch({ type: "MESSAGE_SENT" });

    try {
      const payload = await sendMessage(sessionId, text);
      setMessages((prev) => [...prev, payload.message]);
      setFlights(payload.flights);

      if (payload.destinationId) {
        dispatch({
          type: "DESTINATION_DECIDED",
          destinationId: payload.destinationId,
        });
      } else {
        // Covers both a real clarifying question (clarificationNeeded) and
        // the Section 6.4 generic error fallback ("Shall we try again?") —
        // neither decided a destination, so both return to CHATTING with
        // the message already appended above.
        dispatch({ type: "CLARIFICATION_NEEDED" });
      }
    } catch {
      // Network/SSE failure: no response ever arrived, so this reuses the
      // existing timeout/retry path (Section 7 rule 4) rather than
      // inventing a separate network-error event.
      dispatch({ type: "THINKING_TIMEOUT" });
    }
  }

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
          <Chat messages={messages} onSendMessage={handleSendMessage} />
        </div>
      );

    case "THINKING":
      return (
        <div data-scene="THINKING">
          <Thinking
            timedOut={scene.timedOut}
            onTimeout={() => dispatch({ type: "THINKING_TIMEOUT" })}
            onRetry={() => dispatch({ type: "RETRY" })}
          />
        </div>
      );

    case "FLYTHROUGH":
      return (
        <div data-scene="FLYTHROUGH">
          <Flythrough
            destinationId={scene.destinationId}
            onComplete={() => dispatch({ type: "FLYTHROUGH_COMPLETE" })}
          />
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
          <TravelOptions flights={flights} accommodationTip={null} />
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
