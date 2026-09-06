import { MockFlightAdapter } from "./mock-flight-adapter";
import type { FlightSearchInput } from "../domain/types";

const adapter = new MockFlightAdapter();

const baseInput: FlightSearchInput = {
  origin: "GRU",
  destination: "AGP",
  departure_date: "2026-10-01",
  passengers: 1,
};

describe("MockFlightAdapter", () => {
  it("generates exactly 3 options: economy, intermediate, premium", async () => {
    const result = await adapter.search(baseInput);
    expect(result.success).toBe(true);
    expect(result.options).toHaveLength(3);
    expect(result.options.map((o) => o.tier)).toEqual([
      "economy",
      "intermediate",
      "premium",
    ]);
  });

  it("keeps prices consistent with tier ordering (economy < intermediate < premium)", async () => {
    const result = await adapter.search(baseInput);
    const [economy, intermediate, premium] = result.options;
    expect(economy!.price.total).toBeLessThan(intermediate!.price.total);
    expect(intermediate!.price.total).toBeLessThan(premium!.price.total);
  });

  it("gives economy 1-2 stops and premium a direct flight", async () => {
    const result = await adapter.search(baseInput);
    const [economy, intermediate, premium] = result.options;
    expect(economy!.outbound.stops).toBeGreaterThanOrEqual(1);
    expect(economy!.outbound.stops).toBeLessThanOrEqual(2);
    expect(intermediate!.outbound.stops).toBe(1);
    expect(premium!.outbound.stops).toBe(0);
  });

  it("is deterministic: the same route returns the same prices every time", async () => {
    const first = await adapter.search(baseInput);
    const second = await adapter.search(baseInput);
    expect(first.options.map((o) => o.price.total)).toEqual(
      second.options.map((o) => o.price.total),
    );
  });

  it("varies prices by route", async () => {
    const gruAgp = await adapter.search(baseInput);
    const gruCmb = await adapter.search({
      ...baseInput,
      destination: "CMB",
    });
    expect(gruAgp.options.map((o) => o.price.total)).not.toEqual(
      gruCmb.options.map((o) => o.price.total),
    );
  });

  it("includes the indicative-price disclaimer on every option", async () => {
    const result = await adapter.search(baseInput);
    for (const option of result.options) {
      expect(option.notes).toContain(
        "Indicative price (demo) — subject to change",
      );
    }
  });

  it("only builds a return leg when return_date is provided", async () => {
    const oneWay = await adapter.search(baseInput);
    expect(oneWay.options[0]?.return).toBeUndefined();

    const roundTrip = await adapter.search({
      ...baseInput,
      return_date: "2026-10-08",
    });
    expect(roundTrip.options[0]?.return).toBeDefined();
  });
});
