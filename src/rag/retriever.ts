// src/rag/retriever.ts
// Source of truth: WAYREEL.md Section 9.2 (Embedding Strategy). SQLite +
// manual in-memory cosine similarity, no vector index (documented as
// unnecessary at 5 destinations). See CLAUDE.md "Before any change".
//
// Model name confirmed live against the Google AI Studio catalog for this
// project's API key (2026-09-01, ListModels — see #105 verification): the
// only stable (non-preview) embedding-capable model returned was
// "gemini-embedding-001". Re-check aistudio.google.com/rate-limit /
// ListModels if this ever starts failing — WAYREEL.md Section 9.2 doesn't
// pin a version, so availability may change (same caveat as the chat model
// in Section 4).

import Database from "better-sqlite3";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Destination } from "../domain/types";

const EMBEDDING_MODEL = "gemini-embedding-001";

export function initDatabase(dbPath: string): Database.Database {
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS destinations (
      id TEXT PRIMARY KEY,
      embedding BLOB NOT NULL,
      metadata TEXT NOT NULL
    )
  `);
  return db;
}

// WAYREEL.md Section 9.2: "Text to embed: name + '. ' + vibe_description +
// ' Tags: ' + tags.join(', ') + '. Best for: ' + best_for.join(', ')"
export function buildEmbeddingText(destination: Destination): string {
  return (
    destination.name +
    ". " +
    destination.vibe_description +
    " Tags: " +
    destination.tags.join(", ") +
    ". Best for: " +
    destination.best_for.join(", ")
  );
}

export async function embedText(
  text: string,
  apiKey: string,
): Promise<number[]> {
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

function embeddingToBlob(embedding: number[]): Buffer {
  return Buffer.from(new Float32Array(embedding).buffer);
}

function blobToEmbedding(blob: Buffer): number[] {
  return Array.from(
    new Float32Array(blob.buffer, blob.byteOffset, blob.byteLength / 4),
  );
}

export function storeDestinationEmbedding(
  db: Database.Database,
  destination: Destination,
  embedding: number[],
): void {
  db.prepare(
    `INSERT OR REPLACE INTO destinations (id, embedding, metadata) VALUES (?, ?, ?)`,
  ).run(
    destination.id,
    embeddingToBlob(embedding),
    JSON.stringify(destination),
  );
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function retrieveTopK(
  db: Database.Database,
  queryEmbedding: number[],
  k: number = 3,
): Destination[] {
  const rows = db
    .prepare(`SELECT embedding, metadata FROM destinations`)
    .all() as { embedding: Buffer; metadata: string }[];

  const scored = rows.map((row) => ({
    destination: JSON.parse(row.metadata) as Destination,
    score: cosineSimilarity(queryEmbedding, blobToEmbedding(row.embedding)),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, k).map((entry) => entry.destination);
}
