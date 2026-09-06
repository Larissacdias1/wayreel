// src/mcp/duffel-adapter.ts
// Source of truth: WAYREEL.md Section 10.1 (Adapter Pattern). Structure
// only — per ADR-018, MockFlightAdapter is the default/active provider;
// DuffelAdapter exists "once an account/token exists", which it does not
// yet. Same interface as MockFlightAdapter (both implement FlightProvider,
// src/mcp/flight-provider.ts) — issue #110 DoD: "Same interface as Mock".
//
// NOT ACTIVATED. Toggle example from WAYREEL.md Section 10.1 (this class
// is the commented-out branch, MockFlightAdapter is the one actually used):
//
//   const provider = new MockFlightAdapter(); // MVP
//   // const provider = new DuffelAdapter(); // Future
//
// [DECISION REQUIRED] No Duffel API key, account, or SDK version is
// documented anywhere in WAYREEL.md — this class is a structural
// placeholder only. Do not implement a real API call against Duffel until
// that decision is made.

import type { FlightProvider } from "./flight-provider";
import type { FlightSearchInput, FlightSearchResult } from "../domain/types";

export class DuffelAdapter implements FlightProvider {
  async search(_input: FlightSearchInput): Promise<FlightSearchResult> {
    throw new Error(
      "DuffelAdapter is not implemented yet — see the [DECISION REQUIRED] note in this file. MockFlightAdapter is the active provider (WAYREEL.md ADR-018).",
    );
  }
}
