// src/mcp/mock-flight-adapter.ts
// Source of truth: WAYREEL.md Section 10.1 (Adapter Pattern), 10.2
// (MockFlightAdapter), 10.3 (Tool Contract). Do not add retry/circuit-breaker
// logic here — that is Section 10.5's responsibility, owned by the caller
// (flight-tool.ts, issue #111), not the adapter itself.

import type {
  FlightSearchInput,
  FlightSearchResult,
  FlightOption,
  FlightLeg,
} from "../domain/types";

// WAYREEL.md Section 10.2: "Real airlines: TAP, LATAM, Emirates, Qatar
// Airways, Turkish Airlines, etc."
const AIRLINES: { name: string; code: string }[] = [
  { name: "TAP Air Portugal", code: "TP" },
  { name: "LATAM Airlines", code: "LA" },
  { name: "Emirates", code: "EK" },
  { name: "Qatar Airways", code: "QR" },
  { name: "Turkish Airlines", code: "TK" },
];

// Deterministic hubs used for connecting segments — no real routing data
// source is specified, this only needs to look plausible and be deterministic
// per route (WAYREEL.md Section 10.2: "deterministic rules").
const HUBS = ["MAD", "IST", "DXB"];

// Deterministic, route-specific seed — same route always yields the same
// prices/airlines/stops (WAYREEL.md Section 10.2: "deterministic rules",
// "Prices vary by route").
function routeSeed(origin: string, destination: string): number {
  const str = `${origin}-${destination}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

function buildLeg(
  origin: string,
  destination: string,
  departureIso: string,
  stops: number,
  seed: number,
): FlightLeg {
  const legDurationMinutes = 180 + stops * 240 + (seed % 60);
  const segments: FlightLeg["segments"] = [];

  if (stops === 0) {
    segments.push({
      from: origin,
      to: destination,
      flight_number: `${AIRLINES[seed % AIRLINES.length]?.code}${100 + (seed % 900)}`,
      duration_minutes: legDurationMinutes,
    });
  } else {
    const stopHubs = Array.from(
      { length: stops },
      (_, i) => HUBS[(seed + i) % HUBS.length] as string,
    );
    const points = [origin, ...stopHubs, destination];
    const perSegmentMinutes = Math.round(legDurationMinutes / points.length);
    for (let i = 0; i < points.length - 1; i++) {
      segments.push({
        from: points[i] as string,
        to: points[i + 1] as string,
        flight_number: `${AIRLINES[(seed + i) % AIRLINES.length]?.code}${100 + ((seed + i) % 900)}`,
        duration_minutes: perSegmentMinutes,
      });
    }
  }

  return {
    departure: { airport: origin, time: departureIso },
    arrival: {
      airport: destination,
      time: addMinutes(departureIso, legDurationMinutes),
    },
    duration_minutes: legDurationMinutes,
    stops,
    segments,
  };
}

function buildOption(
  input: FlightSearchInput,
  tier: FlightOption["tier"],
  price: number,
  stops: number,
  seed: number,
  index: number,
): FlightOption {
  const airline = AIRLINES[(seed + index) % AIRLINES.length] as {
    name: string;
    code: string;
  };
  const departureIso = `${input.departure_date}T08:00:00.000Z`;
  const outbound = buildLeg(
    input.origin,
    input.destination,
    departureIso,
    stops,
    seed + index,
  );
  const returnLeg = input.return_date
    ? buildLeg(
        input.destination,
        input.origin,
        `${input.return_date}T08:00:00.000Z`,
        stops,
        seed + index + 1,
      )
    : undefined;

  return {
    id: `mock-${input.origin}-${input.destination}-${tier}-${seed % 10000}`,
    tier,
    price: { total: Math.round(price), currency: "USD" },
    outbound,
    return: returnLeg,
    airline,
    notes: ["Indicative price (demo) — subject to change"],
  };
}

export class MockFlightAdapter {
  async search(input: FlightSearchInput): Promise<FlightSearchResult> {
    const seed = routeSeed(input.origin, input.destination);

    // Price ranges chosen to align with the not-yet-implemented classifyTier
    // (WAYREEL.md Section 10.4) — no board issue implements it yet (checked
    // #109-#133; the closest is #124 "searchFlights", whose DoD only says
    // "validates result" without naming classifyTier or the
    // validateFlightResults node Section 8.2 describes as a separate step).
    // If classifyTier's thresholds end up different from
    // economy<300/intermediate[400,700)/premium>800, this adapter's tests
    // need to be revisited.
    const economyStops = 1 + (seed % 2); // 1-2 stops
    const economyPrice = 150 + (seed % 150); // < 300
    const intermediatePrice = 400 + (seed % 300); // >= 400, < 800 with stops=1
    const premiumPrice = 850 + (seed % 400); // > 800

    const options: FlightOption[] = [
      buildOption(input, "economy", economyPrice, economyStops, seed, 0),
      buildOption(input, "intermediate", intermediatePrice, 1, seed, 1),
      buildOption(input, "premium", premiumPrice, 0, seed, 2),
    ];

    return {
      success: true,
      options,
      meta: {
        searched_at: new Date().toISOString(),
        provider: "mock",
        cache_hit: false,
      },
    };
  }
}
