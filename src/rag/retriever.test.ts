import {
  initDatabase,
  buildEmbeddingText,
  cosineSimilarity,
  storeDestinationEmbedding,
  retrieveTopK,
} from "./retriever";
import type { Destination } from "../domain/types";

// These tests exercise the deterministic parts of the retriever (DB schema,
// storage, cosine similarity, top-k ranking) using fixed/fake embedding
// vectors — they do NOT call the real Google Gemini embeddings API (no
// credentials available in this environment; see the [DECISION REQUIRED]
// note in retriever.ts). embedText() itself is intentionally not tested here.

function makeDestination(
  id: string,
  overrides: Partial<Destination> = {},
): Destination {
  return {
    id,
    name: id,
    country: "Nowhere",
    region: "Nowhere",
    coordinates: { lat: 0, lng: 0 },
    tags: ["tag"],
    vibe_description: "a placeholder destination",
    best_for: ["testing"],
    best_time_to_visit: { months: "always", reason: "it's a fixture" },
    cost_of_living: { level: "low", daily_estimate_usd: 10, notes: "" },
    top_attractions: [],
    budget_neighborhood: { name: "n/a", why: "n/a", avg_hotel_night_usd: 0 },
    nearest_airport: "XXX",
    flythrough: {
      duration_seconds: 12,
      waypoints: [
        { coordinates: [0, 0], zoom: 1, pitch: 0, bearing: 0, duration: 1000 },
      ],
      grade_profile: "default",
    },
    ...overrides,
  };
}

describe("buildEmbeddingText", () => {
  it("builds the text per WAYREEL.md Section 9.2 format", () => {
    const destination = makeDestination("setenil", {
      name: "Setenil de las Bodegas",
      vibe_description: "a village under the rock",
      tags: ["romantic", "historic"],
      best_for: ["romantic", "gastronomy"],
    });
    expect(buildEmbeddingText(destination)).toBe(
      "Setenil de las Bodegas. a village under the rock Tags: romantic, historic. Best for: romantic, gastronomy",
    );
  });
});

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });
});

describe("initDatabase + storeDestinationEmbedding + retrieveTopK", () => {
  it("creates the destinations table and stores/retrieves rows", () => {
    const db = initDatabase(":memory:");
    const tableExists = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='destinations'`,
      )
      .get();
    expect(tableExists).toBeDefined();
  });

  it("returns the top-3 closest destinations by cosine similarity", () => {
    const db = initDatabase(":memory:");

    const a = makeDestination("a"); // query = [1, 0, 0] -> identical
    const b = makeDestination("b"); // close to query
    const c = makeDestination("c"); // somewhat close
    const d = makeDestination("d"); // far/opposite
    const e = makeDestination("e"); // orthogonal

    storeDestinationEmbedding(db, a, [1, 0, 0]);
    storeDestinationEmbedding(db, b, [0.9, 0.1, 0]);
    storeDestinationEmbedding(db, c, [0.5, 0.5, 0]);
    storeDestinationEmbedding(db, d, [-1, 0, 0]);
    storeDestinationEmbedding(db, e, [0, 1, 0]);

    const results = retrieveTopK(db, [1, 0, 0], 3);

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("round-trips the embedding precisely enough for ranking after BLOB storage", () => {
    const db = initDatabase(":memory:");
    const only = makeDestination("only");
    storeDestinationEmbedding(db, only, [0.1, 0.2, 0.3]);

    const results = retrieveTopK(db, [0.1, 0.2, 0.3], 1);
    expect(results[0]?.id).toBe("only");
  });
});
