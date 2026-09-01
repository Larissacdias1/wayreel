// src/domain/types.ts
// Source of truth: WAYREEL.md Section 6.1 (Main entities). Do not add fields
// or types not specified there — see CLAUDE.md "Before any change".

export interface TravelIntent {
  vibe?: string;
  budget_level?: "low" | "medium" | "high" | "flexible";
  budget_amount?: number;
  budget_currency?: string;
  origin_city?: string;
  origin_iata?: string;
  passengers?: number;
  dates_flexibility?: "fixed" | "flexible";
  departure_date?: string; // YYYY-MM-DD
  return_date?: string; // YYYY-MM-DD
  duration_days?: number;
  restrictions?: string[];
  missing_info?: string[];
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
  coordinates: { lat: number; lng: number };
  tags: string[];
  vibe_description: string;
  best_for: string[];
  best_time_to_visit: { months: string; reason: string };
  cost_of_living: {
    level: "low" | "medium" | "high";
    daily_estimate_usd: number;
    notes: string;
  };
  top_attractions: { name: string; description: string; must_see: boolean }[];
  budget_neighborhood: {
    name: string;
    why: string;
    avg_hotel_night_usd: number;
  };
  physical_exertion?: { level: "low" | "medium" | "high"; notes: string };
  less_hyped_alternative?: { name: string; description: string };
  nearest_airport: string; // IATA code
  flythrough: {
    duration_seconds: number;
    waypoints: CameraWaypoint[];
    grade_profile: string;
  };
}

export interface CameraWaypoint {
  coordinates: [number, number]; // [lng, lat]
  zoom: number;
  pitch: number;
  bearing: number;
  duration: number; // ms until the next waypoint
  hold?: number; // ms of pause
}

export interface DestinationRecommendation {
  destination_id: string;
  confidence: number; // 0-1
  reason: string;
  caveats: string[];
}

export interface FlightSearchInput {
  origin: string; // IATA
  destination: string; // IATA
  departure_date: string; // YYYY-MM-DD
  return_date?: string;
  passengers: number; // 1-9
  class?: "economy" | "premium_economy" | "business" | "first";
}

export interface FlightOption {
  id: string;
  tier: "economy" | "intermediate" | "premium";
  price: { total: number; currency: string; breakdown?: string };
  outbound: FlightLeg;
  return?: FlightLeg;
  airline: { name: string; code: string; logo_url?: string };
  booking_url?: string;
  notes: string[];
}

export interface FlightLeg {
  departure: { airport: string; time: string };
  arrival: { airport: string; time: string };
  duration_minutes: number;
  stops: number;
  segments: {
    from: string;
    to: string;
    flight_number?: string;
    duration_minutes: number;
  }[];
}

export interface FlightSearchResult {
  success: boolean;
  error?: string;
  options: FlightOption[];
  meta: { searched_at: string; provider: string; cache_hit: boolean };
}

export interface TravelExperienceResult {
  destination: { id: string; name: string; reason: string };
  cinematic: { destinationId: string };
  flights: FlightOption[];
  explanation: { matchedPreferences: string[]; caveats: string[] };
}

export type ExperienceState =
  | { type: "conversation" }
  | { type: "thinking" }
  | { type: "clarifying"; question: string }
  | { type: "destination-reveal"; destinationId: string }
  | { type: "cinematic"; destinationId: string }
  | { type: "travel-options"; options: FlightOption[] }
  | { type: "alternative"; destinationId: string; previousId: string }
  | { type: "error"; message: string };

export interface Trace {
  id: string;
  session_id: string;
  nodes: TraceNode[];
  started_at: string;
  ended_at?: string;
  status: "running" | "completed" | "error";
}

export interface TraceNode {
  name: string;
  started_at: string;
  ended_at?: string;
  status: "running" | "completed" | "error";
  error?: string;
  tokens?: number;
  cost_usd?: number;
}
