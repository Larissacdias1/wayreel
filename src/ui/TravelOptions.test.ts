import { orderFlightsByTier, TIER_COLOR } from "./TravelOptions";
import type { FlightOption } from "../domain/types";

function makeFlight(
  id: string,
  tier: FlightOption["tier"],
  total: number,
): FlightOption {
  return {
    id,
    tier,
    price: { total, currency: "USD" },
    outbound: {
      departure: { airport: "GRU", time: "2026-12-15T10:00:00Z" },
      arrival: { airport: "AGP", time: "2026-12-16T10:00:00Z" },
      duration_minutes: 900,
      stops: 1,
      segments: [],
    },
    airline: { name: "Test Airlines", code: "TA" },
    notes: [],
  };
}

describe("orderFlightsByTier (WAYREEL.md Section 7 — 'economy→premium card arc')", () => {
  it("orders flights economy -> intermediate -> premium regardless of input order", () => {
    const flights = [
      makeFlight("1", "premium", 900),
      makeFlight("2", "economy", 150),
      makeFlight("3", "intermediate", 400),
    ];

    expect(orderFlightsByTier(flights).map((f) => f.tier)).toEqual([
      "economy",
      "intermediate",
      "premium",
    ]);
  });

  it("returns an empty array for no flights", () => {
    expect(orderFlightsByTier([])).toEqual([]);
  });

  it("preserves all flights of the same tier (no dropping)", () => {
    const flights = [
      makeFlight("1", "economy", 150),
      makeFlight("2", "economy", 160),
    ];
    expect(orderFlightsByTier(flights)).toHaveLength(2);
  });
});

describe("TIER_COLOR", () => {
  it("defines a color for all 3 tiers using existing design tokens (docs/DESIGN_TOKENS.md, ADR-028), not invented values", () => {
    expect(TIER_COLOR).toEqual({
      economy: "var(--text-secondary)",
      intermediate: "var(--text-primary)",
      premium: "var(--accent)",
    });
  });
});
