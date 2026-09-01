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
 *
 * [DECISION REQUIRED] The test database path and the exact way to run the
 * seed depend on `src/rag/seed.ts`, which does not exist yet (empty skeleton
 * in src/rag/). This file assumes the interface below — adjust the import
 * once the real seed is implemented.
 */

const TEST_DB_PATH = path.resolve(__dirname, "../data/wayreel.test.sqlite");

async function globalSetup(_config: FullConfig) {
  // Ensures a test database isolated from the development database.
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  process.env.DATABASE_PATH = TEST_DB_PATH;
  process.env.FLIGHT_ADAPTER = "mock"; // never "duffel" in E2E

  // Dynamic import: assumes src/rag/seed.ts exports `seedDestinations`
  // taking the database path. Adjust once the real module exists.
  const { seedDestinations } = await import("../src/rag/seed");
  await seedDestinations(TEST_DB_PATH);
}

export default globalSetup;
