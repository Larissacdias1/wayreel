import { searchFlights, __resetCircuitBreakerForTests } from "./flight-tool";
import type { FlightProvider } from "./flight-provider";
import type { FlightSearchInput, FlightSearchResult } from "../domain/types";

const validInput: FlightSearchInput = {
  origin: "GRU",
  destination: "AGP",
  departure_date: "2026-10-01",
  passengers: 1,
};

function makeResult(
  options: FlightSearchResult["options"] = [],
): FlightSearchResult {
  return {
    success: true,
    options,
    meta: {
      searched_at: "2026-01-01T00:00:00.000Z",
      provider: "mock",
      cache_hit: false,
    },
  };
}

const fakeOption = {
  id: "fake-1",
  tier: "economy" as const,
  price: { total: 200, currency: "USD" },
  outbound: {
    departure: { airport: "GRU", time: "2026-10-01T08:00:00.000Z" },
    arrival: { airport: "AGP", time: "2026-10-01T20:00:00.000Z" },
    duration_minutes: 720,
    stops: 1,
    segments: [],
  },
  airline: { name: "Fake Air", code: "FA" },
  notes: [],
};

beforeEach(() => {
  __resetCircuitBreakerForTests();
});

describe("searchFlights", () => {
  it("validates input with Zod and rejects invalid input", async () => {
    await expect(searchFlights({ origin: "GRU" })).rejects.toThrow();
  });

  it("calls the adapter and returns its result on success", async () => {
    const fakeProvider: FlightProvider = {
      search: jest.fn().mockResolvedValue(makeResult([fakeOption])),
    };
    const result = await searchFlights(validInput, fakeProvider);
    expect(result.success).toBe(true);
    expect(result.options).toHaveLength(1);
    expect(fakeProvider.search).toHaveBeenCalledTimes(1);
  });

  it("retries once with backoff on adapter error, then succeeds", async () => {
    const search = jest
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(makeResult([fakeOption]));
    const fakeProvider: FlightProvider = { search };

    const result = await searchFlights(validInput, fakeProvider);

    expect(result.success).toBe(true);
    expect(search).toHaveBeenCalledTimes(2);
  }, 10_000);

  it("returns a friendly error when the adapter fails twice in a row", async () => {
    const fakeProvider: FlightProvider = {
      search: jest.fn().mockRejectedValue(new Error("boom")),
    };

    const result = await searchFlights(validInput, fakeProvider);

    expect(result.success).toBe(false);
    expect(result.options).toEqual([]);
    expect(result.error).toBeDefined();
  }, 10_000);

  it("suggests an alternative airport when no flights are found", async () => {
    const fakeProvider: FlightProvider = {
      search: jest.fn().mockResolvedValue(makeResult([])),
    };

    const result = await searchFlights(validInput, fakeProvider);

    expect(result.success).toBe(true);
    expect(result.options).toEqual([]);
    expect(result.error).toMatch(/nearby airport/i);
  });

  it("opens the circuit breaker after 5 consecutive failures", async () => {
    const fakeProvider: FlightProvider = {
      search: jest.fn().mockRejectedValue(new Error("boom")),
    };

    for (let i = 0; i < 5; i++) {
      const result = await searchFlights(validInput, fakeProvider);
      expect(result.success).toBe(false);
    }

    const callsBeforeCircuitCheck = (fakeProvider.search as jest.Mock).mock
      .calls.length;

    const sixth = await searchFlights(validInput, fakeProvider);
    expect(sixth.success).toBe(false);
    // The circuit is open, so the provider should not be called again.
    expect((fakeProvider.search as jest.Mock).mock.calls.length).toBe(
      callsBeforeCircuitCheck,
    );
  }, 20_000);

  it("cancels and reports 'We searched for alternatives' on timeout (>8s), without retrying", async () => {
    jest.useFakeTimers();
    const search = jest.fn().mockImplementation(
      () => new Promise(() => {}), // never resolves
    );
    const fakeProvider: FlightProvider = { search };

    const resultPromise = searchFlights(validInput, fakeProvider);
    await jest.advanceTimersByTimeAsync(8000);
    const result = await resultPromise;

    expect(result.success).toBe(false);
    expect(result.error).toBe("We searched for alternatives");
    expect(search).toHaveBeenCalledTimes(1); // no retry on timeout

    jest.useRealTimers();
  });
});
