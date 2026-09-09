// src/agent/nodes.ts
// Source of truth: WAYREEL.md Section 8.2 (Nodes table), docs/PROMPTS.md
// Section 2 (Intent Extraction template), docs/SECURITY.md Section 1
// (jailbreak detection patterns), WAYREEL.md Section 6.4 (fallback table).
//
// Model fallback (ADR-015: gemini-3.5-flash primary, gemini-3.1-flash-lite
// on rate limit) is implemented here in callLLM(), reusable by future nodes
// in this file — not named in any Sprint 3 issue's DoD; added as an
// explicit decision for #119 (the first node that calls the LLM for text
// generation), not silently.
//
// Live-API testing surfaced a real bug: docs/PROMPTS.md Section 2 tells the
// LLM to answer unset fields with explicit `null`, but TravelIntentSchema
// (WAYREEL.md Section 6.2) only allows `.optional()` (missing key), not
// `null` — so the LLM's own correctly-formatted output fails Zod validation.
// Fixed locally, without touching the base schema or the prompt: null values
// are normalized to undefined before validating, via a schema used only in
// this file (see NULLABLE_TRAVEL_INTENT_SCHEMA below).

import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  TravelIntentSchema,
  DestinationRecommendationSchema,
} from "../domain/schemas";
import { safeJsonParse } from "../domain/json-parser";
import { initDatabase, embedText, retrieveTopK } from "../rag/retriever";
import type { AgentState } from "./state";
import type { TravelIntent } from "../domain/types";

const PRIMARY_MODEL = "gemini-3.5-flash";
const FALLBACK_MODEL = "gemini-3.1-flash-lite"; // ADR-015: rate-limit fallback

// docs/SECURITY.md Section 1 — regex patterns on user input.
const JAILBREAK_PATTERNS = [
  /ignore (all|previous) (rules|instructions|prompts)/i,
  /you are (now|actually)? ?(a|an)? ?(hacker|developer|admin)/i,
  /DAN|Do Anything Now/i,
  /system prompt|developer mode/i,
  /<!--|-->|<script|javascript:/i,
];

export function detectJailbreak(message: string): boolean {
  return JAILBREAK_PATTERNS.some((pattern) => pattern.test(message));
}

function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("429") || /rate limit/i.test(message);
}

// ADR-015: try the primary model, fall back to the rate-limit model once.
export async function callLLM(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not set — required to call the LLM (WAYREEL.md Section 4).",
    );
  }

  const client = new GoogleGenerativeAI(apiKey);
  try {
    const model = client.getGenerativeModel({ model: PRIMARY_MODEL });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    if (!isRateLimitError(error)) throw error;
    const fallbackModel = client.getGenerativeModel({
      model: FALLBACK_MODEL,
    });
    const result = await fallbackModel.generateContent(prompt);
    return result.response.text();
  }
}

// docs/PROMPTS.md Section 2 — copied verbatim, with placeholders filled in.
function buildExtractIntentPrompt(
  userMessage: string,
  conversationHistory: AgentState["messages"],
): string {
  return `Analyze the user's message and extract the travel intent as JSON.
Message: ${userMessage}
Context: ${JSON.stringify(conversationHistory)}

Extract:
- vibe: string
- budget_level: "low" | "medium" | "high" | "flexible"
- budget_amount: number | null
- budget_currency: string | null
- origin_city: string | null
- origin_iata: string | null (3-letter IATA code. If the origin city is not in a
  known list, extract the IATA code from your own knowledge; return null if
  you are not sure — never invent a code.)
- passengers: number (default 1)
- dates_flexibility: "fixed" | "flexible" | null
- departure_date: string | null (YYYY-MM-DD)
- return_date: string | null (YYYY-MM-DD)
- duration_days: number | null
- restrictions: string[]
- missing_info: string[] (essential fields not yet filled in)

Respond ONLY in valid JSON, no markdown.`;
}

// Normalizes explicit `null` (which the prompt above instructs the LLM to
// use) to `undefined` before validating against TravelIntentSchema, whose
// fields only accept "missing" via .optional(), not `null` — see the note
// at the top of this file.
const NULLABLE_TRAVEL_INTENT_SCHEMA = z.preprocess((data) => {
  if (typeof data !== "object" || data === null) return data;
  const withoutNulls: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    withoutNulls[key] = value === null ? undefined : value;
  }
  return withoutNulls;
}, TravelIntentSchema.partial());

// "merges with previous intent" (#119 DoD): non-null/non-undefined extracted
// fields override the previous value; anything not re-extracted this turn
// is preserved from the previous intent.
export function mergeIntent(
  previous: TravelIntent | null,
  extracted: Partial<TravelIntent>,
): TravelIntent {
  const merged: TravelIntent = { ...(previous ?? {}) };
  for (const [key, value] of Object.entries(extracted)) {
    if (value !== null && value !== undefined) {
      (merged as Record<string, unknown>)[key] = value;
    }
  }
  return merged;
}

// WAYREEL.md Section 6.4 fallback table: "extractIntent | Returns an empty
// intent + full missing_info | Goes to clarify".
const ALL_INTENT_FIELDS: (keyof TravelIntent)[] = [
  "vibe",
  "budget_level",
  "budget_amount",
  "budget_currency",
  "origin_city",
  "origin_iata",
  "passengers",
  "dates_flexibility",
  "departure_date",
  "return_date",
  "duration_days",
  "restrictions",
];

export async function extractIntent(
  state: AgentState,
): Promise<Partial<AgentState>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const userMessage = lastMessage?.content ?? "";

  if (detectJailbreak(userMessage)) {
    return { error: "jailbreak_detected" };
  }

  const prompt = buildExtractIntentPrompt(userMessage, state.messages);
  const raw = await callLLM(prompt);

  const parsed = safeJsonParse(raw, NULLABLE_TRAVEL_INTENT_SCHEMA);
  if (!parsed.success) {
    return {
      intent: { missing_info: ALL_INTENT_FIELDS },
    };
  }

  return { intent: mergeIntent(state.intent, parsed.data) };
}

// docs/PROMPTS.md Section 5 — copied verbatim, with the placeholder filled in.
function buildClarifyPrompt(missingFields: string[]): string {
  return `The user's intent is incomplete. Missing fields: ${missingFields.join(", ")}
Generate ONE short, natural question (maximum 15 words) to get the most important missing piece of information.
Prioritize: origin > budget > vibe > dates.
Response: just the question, no extra quotes.`;
}

// docs/PROMPTS.md Section 5: "Response: just the question, no extra
// quotes" — strip surrounding quotes/whitespace in case the LLM adds them.
export function cleanClarifyResponse(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, "");
}

export async function clarify(state: AgentState): Promise<Partial<AgentState>> {
  const missingFields = state.intent?.missing_info ?? [];
  const prompt = buildClarifyPrompt(missingFields);
  const raw = await callLLM(prompt);
  const question = cleanClarifyResponse(raw);

  return {
    clarification_needed: true,
    clarification_question: question,
  };
}

// Builds the text used to query the RAG by similarity (WAYREEL.md Section
// 8.2: retrieveContext takes TravelIntent, does a "Similarity search in the
// RAG"). No exact query-text format is specified — this follows the same
// spirit as buildEmbeddingText (src/rag/retriever.ts, Section 9.2), using
// the intent fields that describe the trip's vibe.
export function buildIntentQueryText(intent: TravelIntent | null): string {
  if (!intent) return "";
  const parts = [
    intent.vibe,
    intent.budget_level,
    ...(intent.restrictions ?? []),
  ].filter((part): part is string => Boolean(part));
  return parts.join(" ");
}

export async function retrieveContext(
  state: AgentState,
): Promise<Partial<AgentState>> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not set — required to embed the query (WAYREEL.md Section 9.2).",
    );
  }

  const dbPath = process.env.DATABASE_PATH || "data/wayreel.sqlite";
  const db = initDatabase(dbPath);
  try {
    const queryText = buildIntentQueryText(state.intent);
    const embedding = await embedText(queryText, apiKey);
    const destinations = retrieveTopK(db, embedding, 3);
    return { retrieved_destinations: destinations };
  } finally {
    db.close();
  }
}

// docs/PROMPTS.md Section 3 — copied verbatim, with placeholders filled in.
function buildRecommendDestinationPrompt(
  intent: TravelIntent | null,
  destinations: AgentState["retrieved_destinations"],
): string {
  return `You received the user's travel intent and the context of available destinations.
INTENT: ${JSON.stringify(intent)}
DESTINATIONS: ${JSON.stringify(destinations)}

Choose EXACTLY 1 destination. Provide as JSON:
- destination_id: string
- confidence: number (0-1)
- reason: string (2-3 sentences)
- caveats: string[]

Respond ONLY in JSON.`;
}

// WAYREEL.md Section 6.4 fallback table: "recommendDestination | Returns the
// first RAG destination with confidence 0.5 | Never breaks"
export function buildFallbackRecommendation(
  destinations: AgentState["retrieved_destinations"],
): AgentState["recommendation"] {
  const first = destinations[0];
  if (!first) return null;
  return {
    destination_id: first.id,
    confidence: 0.5,
    reason: "Fallback recommendation after a parsing error.",
    caveats: [],
  };
}

// recommendDestination (WAYREEL.md Section 8.2 node table): "Chooses 1
// destination with a confidence score". Note: whether low-confidence
// results should be rejected here or routed to clarify by the graph is the
// open validateRecommendation [DECISION REQUIRED] (Section 8.2) — this node
// only calls the LLM and returns whatever DestinationRecommendation comes
// back, it does not enforce the confidence >= 0.6 threshold itself.
export async function recommendDestination(
  state: AgentState,
): Promise<Partial<AgentState>> {
  const prompt = buildRecommendDestinationPrompt(
    state.intent,
    state.retrieved_destinations,
  );
  const raw = await callLLM(prompt);

  const parsed = safeJsonParse(raw, DestinationRecommendationSchema);
  if (!parsed.success) {
    return {
      recommendation: buildFallbackRecommendation(state.retrieved_destinations),
    };
  }

  return { recommendation: parsed.data };
}
