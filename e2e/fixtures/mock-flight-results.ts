// e2e/fixtures/mock-flight-results.ts
// Mock flight results fixture for E2E tests — docs/PLAYWRIGHT.md Section 5,
// anti-flaky point 1 ("Mock the MCP adapter (MockFlightAdapter) — do not
// depend on Duffel").
//
// This reuses the real MockFlightAdapter (src/mcp/mock-flight-adapter.ts,
// issue #109) rather than duplicating its price/tier logic: it is already
// deterministic per route (WAYREEL.md Section 10.2 — "Generates realistic
// fictional flights based on deterministic rules") and generates exactly 3
// options (economy/intermediate/premium), so re-implementing separate fixed
// data here would only risk drifting from the real adapter's behavior.

import { MockFlightAdapter } from "../../src/mcp/mock-flight-adapter";
import type {
  FlightSearchInput,
  FlightSearchResult,
} from "../../src/domain/types";

const adapter = new MockFlightAdapter();

export function getMockFlightResults(
  input: FlightSearchInput,
): Promise<FlightSearchResult> {
  return adapter.search(input);
}

// Convenience fixed input for the Setenil E2E happy-path flow (WAYREEL.md
// Section 9.1: Setenil's nearest airport is AGP). Deterministic — the same
// route always returns the same 3 options via MockFlightAdapter.
export const SETENIL_FLIGHT_SEARCH_INPUT: FlightSearchInput = {
  origin: "GRU",
  destination: "AGP",
  departure_date: "2026-10-01",
  passengers: 1,
};
