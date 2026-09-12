// src/ui/TravelOptions.tsx
// Source of truth: issue #140 DoD — "Arc of cards, colored tiers, price
// disclaimer, accommodation tip". WAYREEL.md Section 7 — OPTIONS scene:
// "scroll-driven, economy→premium card arc".
//
// [DECISION REQUIRED resolved without asking, low-risk] "colored tiers" has
// no documented color values anywhere (docs/DESIGN_TOKENS.md only defines 6
// generic tokens, none tier-specific). Rather than inventing new colors,
// this reuses the existing frozen tokens (ADR-028) as an ascending-emphasis
// scale: economy → text-secondary, intermediate → text-primary, premium →
// accent — the same "reuse an existing token instead of inventing a value"
// pattern already used for HudOverlay's color (#139). The "arc" shape
// itself has no documented geometry (curve math, angles) beyond the name —
// this renders the cards in economy→premium order without inventing a
// specific curved layout not specified anywhere.

import type { FlightOption } from "../domain/types";

const TIER_ORDER: FlightOption["tier"][] = [
  "economy",
  "intermediate",
  "premium",
];

export const TIER_COLOR: Record<FlightOption["tier"], string> = {
  economy: "var(--text-secondary)",
  intermediate: "var(--text-primary)",
  premium: "var(--accent)",
};

// Extracted as a pure function so the economy→premium ordering (Section 7's
// "card arc") can be unit-tested without jsdom/React Testing Library
// (neither is configured in this project — same constraint noted in
// App.tsx/Chat.tsx/Flythrough.tsx, #137-139).
export function orderFlightsByTier(flights: FlightOption[]): FlightOption[] {
  return TIER_ORDER.flatMap((tier) =>
    flights.filter((flight) => flight.tier === tier),
  );
}

export interface TravelOptionsProps {
  flights: FlightOption[];
  // "For cheaper lodging, consider X — why" (src/agent/nodes.ts's
  // buildAccommodationTip, from Destination.budget_neighborhood) — passed
  // in rather than looked up here, keeping the UI decoupled from RAG data.
  accommodationTip: string | null;
}

export default function TravelOptions({
  flights,
  accommodationTip,
}: TravelOptionsProps) {
  const orderedFlights = orderFlightsByTier(flights);

  return (
    <div data-component="TravelOptions">
      <div data-testid="flight-card-arc">
        {orderedFlights.map((flight) => (
          <div
            key={flight.id}
            data-testid="flight-card"
            data-tier={flight.tier}
            style={{ color: TIER_COLOR[flight.tier] }}
          >
            <p>{flight.tier}</p>
            <p>
              ${flight.price.total} {flight.price.currency}
            </p>
            <p>{flight.airline.name}</p>
          </div>
        ))}
      </div>

      {/* docs/SECURITY.md Section 5 — copied verbatim, same text used in
          src/agent/nodes.ts's buildFinalMessage. */}
      <p data-testid="price-disclaimer">
        Indicative prices, subject to change. Verify at the time of purchase.
      </p>

      {accommodationTip && (
        <p data-testid="accommodation-tip">{accommodationTip}</p>
      )}
    </div>
  );
}
