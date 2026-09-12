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
//
// classifyTier (WAYREEL.md Section 10.4) and validateFlightResults (Section
// 8.2) are implemented in searchFlights below — the [DECISION REQUIRED] in
// Section 10.4/8.2 and this issue's (#124) DoD both flagged that neither had
// an owning issue; resolved by folding them into #124, the only Sprint 3
// issue that calls the flight MCP tool.
//
// buildResponse (#125) has no prompt template in docs/PROMPTS.md (unlike
// extractIntent/recommendDestination/recommendAlternative/clarify, which all
// have one) — assembled deterministically instead of via an LLM call, per
// the Section 2 golden rule ("if a clear deterministic rule exists, do not
// use an LLM"): the recommendation's reason/caveats were already written by
// the LLM in recommendDestination, and flight/accommodation data is already
// structured, so formatting them needs no further generation.

import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  TravelIntentSchema,
  DestinationRecommendationSchema,
} from "../domain/schemas";
import { safeJsonParse } from "../domain/json-parser";
import { initDatabase, embedText, retrieveTopK } from "../rag/retriever";
import { searchFlights as callSearchFlightsTool } from "../mcp/flight-tool";
import { destinations } from "../rag/destinations";
import type { AgentState } from "./state";
import type { TravelIntent, FlightOption } from "../domain/types";

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
function buildClarifyPrompt(
  missingFields: string[],
  originalUserMessage: string,
): string {
  return `The user's intent is incomplete. Missing fields: ${missingFields.join(", ")}
USER'S ORIGINAL MESSAGE: ${originalUserMessage}
Generate ONE short, natural question (maximum 15 words) to get the most important missing piece of information, in the same language as the user's original message above — Portuguese, English, or Spanish; if ambiguous or mixed, default to English, per Section 1 rule 7.
Prioritize: origin > budget > vibe > dates.
Response: just the question, no extra quotes.`;
}

// docs/PROMPTS.md Section 5: "Response: just the question, no extra
// quotes" — strip surrounding quotes/whitespace in case the LLM adds them.
export function cleanClarifyResponse(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, "");
}

// validateIntent (WAYREEL.md Section 8.2 node table): "Zod schema + checks
// required fields". Resolved during #126 (agent/graph.ts), which cannot be
// wired without this node — the required-field priority (origin > budget >
// vibe > dates) matches docs/PROMPTS.md Section 5's clarify prompt.
const REQUIRED_INTENT_FIELDS: (keyof TravelIntent)[] = [
  "origin_iata",
  "budget_level",
  "vibe",
  "departure_date",
];

export function validateIntent(state: AgentState): Partial<AgentState> {
  const intent = state.intent;
  const missing = REQUIRED_INTENT_FIELDS.filter(
    (field) => intent?.[field] === undefined || intent?.[field] === null,
  );

  if (missing.length > 0) {
    return {
      intent: { ...(intent ?? {}), missing_info: missing },
      clarification_needed: true,
    };
  }

  return { clarification_needed: false };
}

export async function clarify(state: AgentState): Promise<Partial<AgentState>> {
  const missingFields = state.intent?.missing_info ?? [];
  const originalUserMessage =
    state.messages[state.messages.length - 1]?.content ?? "";
  const prompt = buildClarifyPrompt(missingFields, originalUserMessage);
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
  originalUserMessage: string,
): string {
  return `You received the user's travel intent and the context of available destinations.
INTENT: ${JSON.stringify(intent)}
DESTINATIONS: ${JSON.stringify(destinations)}
USER'S ORIGINAL MESSAGE: ${originalUserMessage}

Choose EXACTLY 1 destination. Provide as JSON:
- destination_id: string
- confidence: number (0-1)
- reason: string (2-3 sentences, in the same language as the user's original message above — Portuguese, English, or Spanish; if ambiguous or mixed, default to English, per Section 1 rule 7)
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
    state.messages[state.messages.length - 1]?.content ?? "",
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

// validateRecommendation (WAYREEL.md Section 8.1 pipeline: recommendDestination
// → validateRecommendation → searchFlights). Resolved during #126, which
// cannot be wired without this node — see the [DECISION REQUIRED] this
// left open in Section 8.2 (no dedicated table row, no owning issue). The
// confidence >= 0.6 threshold routing already lives in hasRecommendation
// (Section 8.3, implemented in graph.ts); this node instead catches a
// hallucinated destination_id that doesn't match any retrieved destination.
export function validateRecommendation(state: AgentState): Partial<AgentState> {
  const recommendation = state.recommendation;
  if (!recommendation) {
    return { error: "missing_recommendation" };
  }

  const isKnownDestination = state.retrieved_destinations.some(
    (destination) => destination.id === recommendation.destination_id,
  );
  if (!isKnownDestination) {
    return { error: "invalid_recommendation_destination" };
  }

  return {};
}

// docs/PROMPTS.md Section 4 — copied verbatim, with placeholders filled in.
function buildRecommendAlternativePrompt(
  intent: TravelIntent | null,
  rejectedDestinationId: string,
  filteredDestinations: AgentState["retrieved_destinations"],
  originalUserMessage: string,
): string {
  return `The user rejected the previous destination: ${rejectedDestinationId}.
Choose another destination from the available ones, different from the previous one.
INTENT: ${JSON.stringify(intent)}
AVAILABLE DESTINATIONS (excluding the rejected one): ${JSON.stringify(filteredDestinations)}
USER'S ORIGINAL MESSAGE: ${originalUserMessage}

Provide as JSON:
- destination_id: string
- confidence: number (0-1)
- reason: string (2-3 sentences, highlighting what differs from the previous one, in the same language as the user's original message above — Portuguese, English, or Spanish; if ambiguous or mixed, default to English, per Section 1 rule 7)
- caveats: string[]

Respond ONLY in JSON.`;
}

// #123 DoD: "Excludes rejected destination, picks second from RAG list".
export function filterOutRejected(
  destinations: AgentState["retrieved_destinations"],
  rejectedIds: string[],
): AgentState["retrieved_destinations"] {
  return destinations.filter(
    (destination) => !rejectedIds.includes(destination.id),
  );
}

// recommendAlternative (WAYREEL.md Section 8.2 node table): "Chooses a
// second destination, excluding the previous one". #123 DoD: "Excludes
// rejected destination, picks second from RAG list".
export async function recommendAlternative(
  state: AgentState,
): Promise<Partial<AgentState>> {
  const rejectedId =
    state.rejected_destinations[state.rejected_destinations.length - 1] ?? "";
  const filtered = filterOutRejected(
    state.retrieved_destinations,
    state.rejected_destinations,
  );

  const prompt = buildRecommendAlternativePrompt(
    state.intent,
    rejectedId,
    filtered,
    state.messages[state.messages.length - 1]?.content ?? "",
  );
  const raw = await callLLM(prompt);

  const parsed = safeJsonParse(raw, DestinationRecommendationSchema);
  if (!parsed.success) {
    // WAYREEL.md Section 6.4 doesn't have a fallback row specifically for
    // recommendAlternative — reusing recommendDestination's documented
    // fallback (Section 6.4, "Never breaks") against the filtered list as
    // the closest established pattern, rather than inventing new behavior.
    return { recommendation: buildFallbackRecommendation(filtered) };
  }

  return { recommendation: parsed.data };
}

// WAYREEL.md Section 10.4 — copied verbatim (deterministic, "price
// classification is logic, not AI").
export function classifyTier(option: FlightOption): FlightOption["tier"] {
  const price = option.price.total;
  const stops = option.outbound.stops;
  if (stops >= 2 && price < 300) return "economy";
  if (stops === 0 && price > 800) return "premium";
  if (stops === 0 && price > 400) return "intermediate";
  if (stops === 1 && price < 400) return "economy";
  return "intermediate";
}

// validateFlightResults (WAYREEL.md Section 8.2: "Zod + tier
// classification") folded into searchFlights — see the note at the top of
// this file. Re-applies classifyTier to every option so the tier always
// reflects the deterministic rule, regardless of what the provider set.
function normalizeFlightOptions(options: FlightOption[]): FlightOption[] {
  return options.map((option) => ({
    ...option,
    tier: classifyTier(option),
  }));
}

// searchFlights (WAYREEL.md Section 8.2 node table): "Calls the MCP, not the
// API directly". #124 DoD: "Calls MCP tool, validates result, populates
// flights in state".
export async function searchFlights(
  state: AgentState,
): Promise<Partial<AgentState>> {
  const destinationId = state.recommendation?.destination_id;
  const destination = destinations.find((d) => d.id === destinationId);

  if (!destination || !state.intent?.origin_iata) {
    return { error: "missing_flight_search_input" };
  }
  if (!state.intent.departure_date) {
    return { error: "missing_flight_search_input" };
  }

  const input = {
    origin: state.intent.origin_iata,
    destination: destination.nearest_airport,
    departure_date: state.intent.departure_date,
    return_date: state.intent.return_date,
    passengers: state.intent.passengers ?? 1,
  };

  const result = await callSearchFlightsTool(input);

  if (!result.success) {
    return { error: result.error ?? "flight_search_failed", flights: [] };
  }

  return { flights: normalizeFlightOptions(result.options) };
}

function buildFlightOptionsSummary(flights: FlightOption[]): string {
  return flights
    .map(
      (option) =>
        `- ${option.tier}: $${option.price.total} ${option.price.currency} (${option.airline.name})`,
    )
    .join("\n");
}

// #125 DoD: "includes accommodation tip" — from Destination.budget_neighborhood.
function buildAccommodationTip(
  destination: (typeof destinations)[number] | undefined,
): string | null {
  if (!destination) return null;
  const { name, why } = destination.budget_neighborhood;
  return `For cheaper lodging, consider ${name} — ${why}`;
}

// buildResponse (WAYREEL.md Section 8.2 node table): "Formats the cinematic
// response". #125 DoD: "Builds final cinematic message, includes
// accommodation tip".
export function buildFinalMessage(state: AgentState): string {
  // Discovered while wiring agent/graph.ts (#126): clarify (#120) only sets
  // clarification_needed/clarification_question, it never appends to
  // state.messages — buildResponse is the single place that turns any node
  // output into the turn's final message, so it must handle this case too.
  if (state.clarification_needed && state.clarification_question) {
    return state.clarification_question;
  }

  // Discovered while verifying #132 (jailbreak detection): a jailbreak hit
  // was falling into the generic error fallback below instead of
  // docs/PROMPTS.md Section 6's specific redirect, copied verbatim here.
  if (state.error === "jailbreak_detected") {
    return "Let's focus on your next adventure! Tell me: what kind of experience makes you dream? Beach, mountains, historic city?";
  }

  // WAYREEL.md Section 6.4 fallback table: "buildResponse | Returns a
  // generic error message | Shall we try again?"
  if (state.error || !state.recommendation || state.flights.length === 0) {
    return "Shall we try again?";
  }

  const destination = destinations.find(
    (d) => d.id === state.recommendation?.destination_id,
  );

  const parts = [
    `I recommend **${destination?.name ?? state.recommendation.destination_id}**. ${state.recommendation.reason}`,
    buildFlightOptionsSummary(state.flights),
    buildAccommodationTip(destination),
    // docs/SECURITY.md Section 5 — both disclaimers, copied verbatim.
    "Indicative prices, subject to change. Verify at the time of purchase.",
    "Visa requirements vary by nationality — always confirm with your country's consulate before booking.",
  ].filter((part): part is string => Boolean(part));

  return parts.join("\n\n");
}

export async function buildResponse(
  state: AgentState,
): Promise<Partial<AgentState>> {
  const content = buildFinalMessage(state);
  return {
    messages: [...state.messages, { role: "assistant", content }],
  };
}
