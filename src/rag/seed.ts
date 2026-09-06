// src/rag/seed.ts
// Populates the SQLite RAG database with the 5 curated destinations
// (src/rag/destinations.ts) and their Gemini embeddings (src/rag/retriever.ts).
// Interface (`seedDestinations(dbPath)`) is dictated by e2e/global-setup.ts,
// written before this file existed — see its [DECISION REQUIRED] note.

import { destinations } from "./destinations";
import {
  initDatabase,
  buildEmbeddingText,
  embedText,
  storeDestinationEmbedding,
} from "./retriever";

export async function seedDestinations(dbPath: string): Promise<void> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not set — required to generate embeddings (WAYREEL.md Section 9.2).",
    );
  }

  const db = initDatabase(dbPath);

  for (const destination of destinations) {
    const text = buildEmbeddingText(destination);
    const embedding = await embedText(text, apiKey);
    storeDestinationEmbedding(db, destination, embedding);
  }

  db.close();
}

async function main() {
  const dbPath = process.env.DATABASE_PATH || "data/wayreel.sqlite";
  await seedDestinations(dbPath);
  console.log(`Seeded ${destinations.length} destinations into ${dbPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
