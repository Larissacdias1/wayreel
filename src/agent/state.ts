// src/agent/state.ts
// Source of truth: WAYREEL.md Section 8.4 (Agent state). Interface copied
// verbatim — do not add fields not specified there.

import type {
  TravelIntent,
  DestinationRecommendation,
  FlightOption,
  ExperienceState,
} from "../domain/types";

export interface AgentState {
  session_id: string;
  messages: { role: "user" | "assistant"; content: string }[];
  intent: TravelIntent | null;
  clarification_needed: boolean;
  clarification_question: string | null;
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
    recommendation: null,
    rejected_destinations: [],
    flights: [],
    experience_state: { type: "conversation" },
    error: null,
  };
}
