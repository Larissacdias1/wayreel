import type { FullConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Playwright global setup — runs once before the whole suite.
 * Reference specs: docs/PLAYWRIGHT.md Section 5 (anti-flaky strategy).
 *
 * Responsibilities (once only, not per test):
 * 1. Ensure a clean test SQLite database with a deterministic seed of the
 *    5 RAG destinations (WAYREEL.md Section 9.1) — never the dev/production database.
 * 2. Confirm the environment is in mock mode (MockFlightAdapter, never
 *    real Duffel during E2E — WAYREEL.md Section 10.1, ADR-018).
 *
 * What this file does NOT do: per-test reset (that's the responsibility of
 * each spec/fixture, anti-flaky point 5 — "each test resets the database and
 * session"). This is only the environment setup that runs a single time.
 */

const TEST_DB_PATH = path.resolve(__dirname, "../data/wayreel.test.sqlite");

async function globalSetup(_config: FullConfig) {
  // Ensures a test database isolated from the development database.
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  process.env.DATABASE_PATH = TEST_DB_PATH;
  process.env.FLIGHT_ADAPTER = "mock"; // never "duffel" in E2E

  // Deterministic fixture (e2e/fixtures/seed-destinations.ts) — never the
  // real Gemini-backed src/rag/seed.ts, so E2E never depends on a live
  // network call (docs/PLAYWRIGHT.md Section 5, anti-flaky point 2).
  const { seedDeterministicDestinations } =
    await import("./fixtures/seed-destinations");
  seedDeterministicDestinations(TEST_DB_PATH);
}

export default globalSetup;
