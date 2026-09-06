// e2e/fixtures/seed-destinations.ts
// Deterministic RAG seed for E2E tests — docs/PLAYWRIGHT.md Section 5,
// anti-flaky point 2 ("Deterministic SQLite seed — RAG returns the same
// destinations") and point 5 ("Each test resets the database and session").
//
// Unlike src/rag/seed.ts (#106), this does NOT call the real Gemini
// embeddings API: a live network call would make E2E runs flaky, slow, and
// dependent on a real API key/quota, which contradicts the anti-flaky
// strategy. Instead it derives a fixed pseudo-embedding per destination id
// from a simple seeded hash — same id always produces the same vector, so
// retrieval results are reproducible across runs.

import fs from "node:fs";
import { destinations } from "../../src/rag/destinations";
import {
  initDatabase,
  storeDestinationEmbedding,
} from "../../src/rag/retriever";

const FIXTURE_EMBEDDING_DIMENSIONS = 32;

// Deterministic: same string always produces the same vector, no randomness.
function deterministicEmbedding(seed: string): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const vector: number[] = [];
  let state = hash || 1;
  for (let i = 0; i < FIXTURE_EMBEDDING_DIMENSIONS; i++) {
    // Simple deterministic LCG, seeded from the hash above — no Math.random().
    state = (state * 1103515245 + 12345) | 0;
    vector.push((state % 1000) / 1000);
  }
  return vector;
}

export function resetDatabase(dbPath: string): void {
  if (dbPath !== ":memory:" && fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}

export function seedDeterministicDestinations(dbPath: string): void {
  resetDatabase(dbPath);
  const db = initDatabase(dbPath);
  for (const destination of destinations) {
    storeDestinationEmbedding(
      db,
      destination,
      deterministicEmbedding(destination.id),
    );
  }
  db.close();
}
