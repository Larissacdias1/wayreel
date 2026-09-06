// src/mcp/flight-provider.ts
// Shared contract for the two adapters named in WAYREEL.md Section 10.1's
// diagram ("FlightSearchService → FlightProvider ├── MockFlightAdapter
// └── DuffelAdapter"). No interface code is given in WAYREEL.md itself —
// this makes the "same interface as Mock" requirement (issue #110) explicit
// and type-checked instead of relying on structural duck-typing alone.

import type { FlightSearchInput, FlightSearchResult } from "../domain/types";

export interface FlightProvider {
  search(input: FlightSearchInput): Promise<FlightSearchResult>;
}
