// src/mcp/flight-tool.ts
// Source of truth: WAYREEL.md Section 10.1 (Adapter Pattern — toggle),
// 10.3 (Tool Contract), 10.5 (Failure Flow). Section 10.5 is not named in
// any board issue's DoD (checked #109-#117); implementing it here was an
// explicit decision (not a silent one) because #116 ("Eval: Test circuit
// breaker") requires this logic to exist somewhere before it can run, and
// this is the only Sprint 2 issue that calls the adapter at all.

import { FlightSearchInputSchema } from "../domain/schemas";
import type { FlightSearchInput, FlightSearchResult } from "../domain/types";
import type { FlightProvider } from "./flight-provider";
import { MockFlightAdapter } from "./mock-flight-adapter";
// import { DuffelAdapter } from "./duffel-adapter"; // Future

const provider: FlightProvider = new MockFlightAdapter(); // MVP
// const provider: FlightProvider = new DuffelAdapter(); // Future

const TIMEOUT_MS = 8000;
const RETRY_BACKOFF_MS = 1000;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_OPEN_MS = 5 * 60 * 1000;

let consecutiveErrors = 0;
let circuitOpenUntil: number | null = null;

// Test-only: resets module-level circuit breaker state between test cases.
export function __resetCircuitBreakerForTests(): void {
  consecutiveErrors = 0;
  circuitOpenUntil = null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class TimeoutError extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function buildMeta() {
  return {
    searched_at: new Date().toISOString(),
    provider: "mock",
    cache_hit: false,
  };
}

function recordFailure(): void {
  consecutiveErrors += 1;
  if (consecutiveErrors >= CIRCUIT_BREAKER_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_OPEN_MS;
  }
}

function resetFailures(): void {
  consecutiveErrors = 0;
}

export async function searchFlights(
  rawInput: unknown,
  flightProvider: FlightProvider = provider,
): Promise<FlightSearchResult> {
  const input: FlightSearchInput = FlightSearchInputSchema.parse(rawInput);

  // WAYREEL.md Section 10.5: "5 consecutive errors → Circuit breaker open for 5 minutes"
  if (circuitOpenUntil !== null) {
    if (Date.now() < circuitOpenUntil) {
      return {
        success: false,
        error:
          "We're having trouble searching flights right now — please try again in a few minutes.",
        options: [],
        meta: buildMeta(),
      };
    }
    circuitOpenUntil = null; // window elapsed
  }

  let result: FlightSearchResult;
  try {
    result = await withTimeout(flightProvider.search(input), TIMEOUT_MS);
  } catch (error) {
    if (error instanceof TimeoutError) {
      // WAYREEL.md Section 10.5: "Timeout > 8s → Cancels the request,
      // success: false, 'We searched for alternatives'" — no retry.
      recordFailure();
      return {
        success: false,
        error: "We searched for alternatives",
        options: [],
        meta: buildMeta(),
      };
    }

    // WAYREEL.md Section 10.5: "Adapter returns an error → Retry once with
    // backoff 1s → if it fails, success: false + a friendly message"
    await sleep(RETRY_BACKOFF_MS);
    try {
      result = await withTimeout(flightProvider.search(input), TIMEOUT_MS);
    } catch {
      recordFailure();
      return {
        success: false,
        error: "We couldn't search flights right now — please try again.",
        options: [],
        meta: buildMeta(),
      };
    }
  }

  resetFailures();

  // WAYREEL.md Section 10.5: "No flights found → success: true, options: []
  // + an alternative airport suggestion"
  if (result.options.length === 0) {
    return {
      ...result,
      error: "No flights found for this route — try a nearby airport.",
    };
  }

  return result;
}
