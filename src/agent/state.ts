// src/agent/state.ts
// Source of truth: WAYREEL.md Section 8.4 (Agent state). Interface copied
// verbatim, plus `retrieved_destinations` — WAYREEL.md Section 8.2 already
// described retrieveContext producing a "List of destinations" consumed by
// recommendDestination, but the interface never had a field for it. Added
// during #121 as a structural gap fix, not a new feature — see WAYREEL.md
// Section 8.4.

import type {
  TravelIntent,
  DestinationRecommendation,
  FlightOption,
  ExperienceState,
  Destination,
} from "../domain/types";

export interface AgentState {
  session_id: string;
  messages: { role: "user" | "assistant"; content: string }[];
  intent: TravelIntent | null;
  clarification_needed: boolean;
  clarification_question: string | null;
  retrieved_destinations: Destination[]; // retrieveContext's output, consumed by recommendDestination
  recommendation: DestinationRecommendation | null;
  rejected_destinations: string[]; // for the "I don't like it" fallback
  flights: FlightOption[];
  experience_state: ExperienceState;
  error: string | null;
}

export function createInitialState(sessionId: string): AgentState {
  return {
    session_id: sessionId,
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
  };
}
