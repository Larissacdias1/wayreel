# Wayreel — Complete Technical Documentation

# AI-guided cinematic booking

# Version: 2.4 · Date: 2026-08-30 (revision: ADR-025 reverted, ADR-027 new, section 17.1) · Status: Ready for coding

# Cost: $0.00 · Constraint: Zero spend, free technologies with a migration path to production

# Repository: Public since the first commit

# Single document, project source of truth (ADR-022). Sections 1-11 cover the MVP (implementation now).

# Prompts, security, and tests live in their own files under docs/ (see Sections 12-14) since they are operational

# content with isolated lookup and a high frequency of change — they are not a second source of truth, just an extraction of the same

# single document. Sections 15-16 cover the long-term vision (post-MVP evolution). Section 17 consolidates the ADRs.

# Code agent (Claude Code) working rules are in CLAUDE.md, at the root of the repository.

## Table of Contents

1. Vision and Context
2. High-Level Architecture
3. Frozen Scope Decisions
4. Tech Stack
5. Directory Structure
6. Domain Schema
7. Experience State Machine
8. Agent Specification (LangGraph)
9. RAG Specification
10. MCP Specification
11. Cinematic Specification
12. Agent Prompts
13. Security & Guardrails
14. Eval Harness + E2E (Playwright)
15. Evolution Roadmap
16. Market Analysis
17. ADRs (Architecture Decision Records)
18. Pre-Launch Checklist
19. Immediate Next Steps

---

## 1. Vision and Context

### 1.1 What it is

Wayreel is an AI-guided cinematic booking product. Instead of search forms, the user chats with an AI about vibe, budget, and constraints. The AI suggests a single destination in a cinematic way (real-time 3D flythrough) and presents flight options from economy to premium — with the posture of a real travel-savings expert.

### 1.2 Dual objective

1. Publishable social proof for international AI freelance outreach (Europe/US)
2. Technical defense material for the graduate program in Applied AI Software Engineering

### 1.3 Core concept

Conversation → 1 destination → 3D Flythrough → Flight options (economy → premium)

### 1.4 Name

Wayreel — wayreel.com available for registration. Free subdomain: wayreel.vercel.app.

### 1.5 Method note

The MVP is deliberately lean — the goal is to prove AI technical depth (agent, MCP, RAG) fast enough to start attracting freelance work, not to build the entire product. The complete vision is documented in Section 15 (Roadmap) and should only be implemented after market validation.

---

## 2. High-Level Architecture

User
↓
React UI (Chat + Cinematic + Flight Cards)
↓
SSE /api/chat
↓
Express API
↓
LangGraph Agent
├── extractIntent → LLM (Gemini)
├── validateIntent → Zod schema
├── clarify (if needed) → LLM
├── retrieveContext → RAG (SQLite)
├── recommendDestination → LLM + RAG context
├── validateRecommendation → confidence threshold
├── searchFlights → MCP Client → MCP Flight Server → Flight Adapter → Mock/Duffel
├── validateFlightResults → Zod + deterministic classification
└── buildResponse → LLM
↓
JSON Response (TravelExperienceResult)
↓
UI renders the appropriate state

Boundary rules:
• Domain (src/domain/) does not know about React, LLM SDKs, MapLibre, or Duffel
• The agent receives RAG context, it does not know about SQL/SQLite
• MCP decouples the agent from the flight provider
• The Cinematic Engine is independent — the agent only passes destinationId
• Golden rule: if a clear deterministic rule exists, do not use an LLM

---

## 3. Frozen Scope Decisions

| Decision                | Detail                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| Name                    | Wayreel (subdomain wayreel.vercel.app, zero cost)                                        |
| Total cost              | $0.00 — every technology is free or has a generous free tier                             |
| Size                    | Lean MVP, functional demo, proof of concept + technical skill                            |
| Visual                  | Real-time 3D flythrough (MapLibre GL + OpenFreeMap, zero cost)                           |
| Price strategies        | Only legitimate tactics (Google Flights/Hopper/Going), delivered via chat                |
| Hidden city ticketing   | OUT OF SCOPE — violates terms of use, real legal precedent                               |
| Architecture            | LangGraph agent, flight search as an MCP tool, lightweight RAG with curated destinations |
| Repository              | Public since the first commit — history is part of the social proof                      |
| Secrets                 | local (never committed) + Vercel environment variables                                   |
| Development environment | Claude Code (ADR-025)                                                                    |

---

## 4. Tech Stack

| Layer                | Technology (MVP)                                                               | Rationale                                                                                                                                                                | Future migration                |
| -------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| Frontend             | React 18 + Vite                                                                | Market decision: ~4x more freelance postings ask for React                                                                                                               | None                            |
| Scroll animation     | GSAP + ScrollTrigger                                                           | More direct than Framer Motion for scroll-linked transforms                                                                                                              | None                            |
| UI animation         | Framer Motion                                                                  | React-first, ideal for choreographed entrances                                                                                                                           | None                            |
| 3D Flythrough        | MapLibre GL JS + OpenFreeMap tiles                                             | Zero cost, no token, real-time rendering                                                                                                                                 | None                            |
| Backend              | Express 4 + TypeScript                                                         | 85% of freelance postings ask for Express                                                                                                                                | Trivial                         |
| LLM                  | Google Gemini 3.5 Flash (via Google AI Studio), fallback Gemini 3.1 Flash-Lite | 1.5 Flash was discontinued; the current free tier varies by account — confirm the live limit at aistudio.google.com/rate-limit before architecting around a fixed number | 1 line: swap provider/model     |
| Embeddings           | Google Gemini embeddings                                                       | Same API key as the LLM, zero additional cost                                                                                                                            | 1 line: swap provider           |
| Orchestration        | LangGraph                                                                      | Explicit state, testable nodes, observable workflow                                                                                                                      | None                            |
| MCP                  | Custom server (@modelcontextprotocol/sdk)                                      | Explicit contract and provider decoupling                                                                                                                                | None                            |
| RAG                  | SQLite (better-sqlite3)                                                        | Zero account, zero config, local file                                                                                                                                    | 2 lines: swap for pgvector      |
| Schema validation    | Zod                                                                            | Validates LLM and API input/output                                                                                                                                       | None                            |
| UI-API communication | Server-Sent Events (SSE)                                                       | A one-way flow is sufficient                                                                                                                                             | None                            |
| Deploy               | Vercel Hobby                                                                   | 100% free frontend, integrated with GitHub                                                                                                                               | One-click upgrade               |
| Observability        | Pino (structured logger) + custom tracer                                       | No paid tool in the MVP                                                                                                                                                  | LangSmith/Phoenix in the future |
| Eval                 | Jest + JSON cases + assertions                                                 | 10 test cases                                                                                                                                                            | Add more cases                  |
| **E2E**              | **Playwright**                                                                 | **Tests the user flow, UI security, accessibility**                                                                                                                      | **None**                        |
| Total MVP cost       | $0.00                                                                          |                                                                                                                                                                          |                                 |

---

## 5. Directory Structure

wayreel/
├── src/
│ ├── domain/ → Types, contracts, schemas (Zod), airport codes, json-parser
│ ├── agent/ → LangGraph: state.ts, nodes.ts, graph.ts
│ ├── mcp/ → MCP server + Flight adapters (Mock + Duffel) + flight tool
│ ├── rag/ → Destinations data, retriever, seed
│ ├── cinematic/
│ │ ├── destinations/ → One file per destination: setenil.ts, mardin.ts, sigiriya.ts, chefchaouen.ts, jiufen.ts (Section 11.5)
│ │ ├── motion/ → camera-path.ts, playback-controller.ts, easing.ts
│ │ ├── grade/ → color-grade.ts, overlay.ts
│ │ └── components/ → CinematicExperience.tsx, HudOverlay.tsx, ReducedMotionFallback.tsx
│ ├── api/ → Express server, routes, SSE endpoint
│ ├── ui/ → React components (App, Chat, Flythrough, TravelOptions)
│ ├── eval/ → Test cases + runner
│ └── observability/ → Logger + tracer
├── e2e/
│ ├── fixtures/ → Mock LLM responses, seed destinations, mock flight results
│ ├── pages/ → Page Object Model (ChatPage, FlythroughPage, TravelOptionsPage)
│ ├── tests/
│ │ ├── happy-path.spec.ts
│ │ ├── alternative.spec.ts
│ │ ├── accessibility.spec.ts
│ │ ├── error-states.spec.ts
│ │ ├── security/
│ │ │ ├── jailbreak.spec.ts
│ │ │ ├── rate-limit.spec.ts
│ │ │ └── input-validation.spec.ts
│ │ └── api/
│ │ └── health.spec.ts
│ └── global-setup.ts
├── data/
│ └── destinations/ → JSON backups of the destinations
├── docs/
│ ├── PROMPTS.md
│ ├── SECURITY.md
│ ├── EVAL_HARNESS.md
│ ├── PLAYWRIGHT.md
│ ├── VISUAL_REFERENCES.md → inspiration sites (Section 7 of the audit process)
│ └── DESIGN_TOKENS.md
├── .github/
│ └── workflows/
│ └── e2e.yml
├── .env.example
├── package.json
├── tsconfig.json
├── playwright.config.ts → at the root, not inside e2e/ (Playwright CLI convention; testDir points to ./e2e/tests)
├── CLAUDE.md → operational rules for the code agent (does not duplicate product content)
├── WAYREEL.md → this file, single source of truth (ADR-022)
└── README.md

Rule: Flat structure in the MVP (ADR-011). Extract packages once there is real reuse. The subdivision inside `cinematic/` (destinations/motion/grade/components) is a clarity refinement, it does not break the flat rule — it is still a single folder inside `src/`.

---

## 6. Domain Schema

### 6.1 Main entities

```typescript
interface TravelIntent {
  vibe?: string;
  budget_level?: "low" | "medium" | "high" | "flexible";
  budget_amount?: number;
  budget_currency?: string;
  origin_city?: string;
  origin_iata?: string;
  passengers?: number;
  dates_flexibility?: "fixed" | "flexible";
  departure_date?: string; // YYYY-MM-DD
  return_date?: string; // YYYY-MM-DD
  duration_days?: number;
  restrictions?: string[];
  missing_info?: string[];
}

interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
  coordinates: { lat: number; lng: number };
  tags: string[];
  vibe_description: string;
  best_for: string[];
  best_time_to_visit: { months: string; reason: string };
  cost_of_living: {
    level: "low" | "medium" | "high";
    daily_estimate_usd: number;
    notes: string;
  };
  top_attractions: { name: string; description: string; must_see: boolean }[];
  budget_neighborhood: {
    name: string;
    why: string;
    avg_hotel_night_usd: number;
  };
  physical_exertion?: { level: "low" | "medium" | "high"; notes: string };
  less_hyped_alternative?: { name: string; description: string };
  nearest_airport: string; // IATA code
  flythrough: {
    duration_seconds: number;
    waypoints: CameraWaypoint[];
    grade_profile: string;
  };
}

interface CameraWaypoint {
  coordinates: [number, number]; // [lng, lat]
  zoom: number;
  pitch: number;
  bearing: number;
  duration: number; // ms until the next waypoint
  hold?: number; // ms of pause
}

interface DestinationRecommendation {
  destination_id: string;
  confidence: number; // 0-1
  reason: string;
  caveats: string[];
}

interface FlightSearchInput {
  origin: string; // IATA
  destination: string; // IATA
  departure_date: string; // YYYY-MM-DD
  return_date?: string;
  passengers: number; // 1-9
  class?: "economy" | "premium_economy" | "business" | "first";
}

interface FlightOption {
  id: string;
  tier: "economy" | "intermediate" | "premium";
  price: { total: number; currency: string; breakdown?: string };
  outbound: FlightLeg;
  return?: FlightLeg;
  airline: { name: string; code: string; logo_url?: string };
  booking_url?: string;
  notes: string[];
}

interface FlightLeg {
  departure: { airport: string; time: string };
  arrival: { airport: string; time: string };
  duration_minutes: number;
  stops: number;
  segments: {
    from: string;
    to: string;
    flight_number?: string;
    duration_minutes: number;
  }[];
}

interface FlightSearchResult {
  success: boolean;
  error?: string;
  options: FlightOption[];
  meta: { searched_at: string; provider: string; cache_hit: boolean };
}

interface TravelExperienceResult {
  destination: { id: string; name: string; reason: string };
  cinematic: { destinationId: string };
  flights: FlightOption[];
  explanation: { matchedPreferences: string[]; caveats: string[] };
}

type ExperienceState =
  | { type: "conversation" }
  | { type: "thinking" }
  | { type: "clarifying"; question: string }
  | { type: "destination-reveal"; destinationId: string }
  | { type: "cinematic"; destinationId: string }
  | { type: "travel-options"; options: FlightOption[] }
  | { type: "alternative"; destinationId: string; previousId: string }
  | { type: "error"; message: string };

interface Trace {
  id: string;
  session_id: string;
  nodes: TraceNode[];
  started_at: string;
  ended_at?: string;
  status: "running" | "completed" | "error";
}

interface TraceNode {
  name: string;
  started_at: string;
  ended_at?: string;
  status: "running" | "completed" | "error";
  error?: string;
  tokens?: number;
  cost_usd?: number;
}
```

### 6.2 Zod Schemas

```typescript
import { z } from "zod";

export const TravelIntentSchema = z.object({
  vibe: z.string().optional(),
  budget_level: z.enum(["low", "medium", "high", "flexible"]).optional(),
  budget_amount: z.number().optional(),
  budget_currency: z.string().optional(),
  origin_city: z.string().optional(),
  origin_iata: z.string().length(3).optional(),
  passengers: z.number().min(1).max(9).optional(),
  dates_flexibility: z.enum(["fixed", "flexible"]).optional(),
  departure_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  return_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  duration_days: z.number().optional(),
  restrictions: z.array(z.string()).optional(),
  missing_info: z.array(z.string()).optional(),
});

export const FlightSearchInputSchema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  return_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  passengers: z.number().min(1).max(9).default(1),
  class: z
    .enum(["economy", "premium_economy", "business", "first"])
    .default("economy"),
});

export const DestinationRecommendationSchema = z.object({
  destination_id: z.string(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  caveats: z.array(z.string()),
});

export const UserMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  session_id: z.string().uuid(),
  conversation_history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional(),
});
```

### 6.3 City → IATA Mapping (Lookup Table)

```typescript
// src/domain/airport-codes.ts
// Base table below; expanded per ADR-033 to give representative global
// coverage — this table is the deterministic fast path, cities not listed
// here fall back to the LLM's own IATA knowledge in extractIntent
// (docs/PROMPTS.md), validated by a 3-letter uppercase regex in
// TravelIntentSchema (src/domain/schemas.ts).
export const CITY_TO_IATA: Record<string, string> = {
  // Brazil
  "sao paulo": "GRU",
  sp: "GRU",
  "rio de janeiro": "GIG",
  rj: "GIG",
  brasilia: "BSB",
  salvador: "SSA",
  recife: "REC",
  fortaleza: "FOR",
  "belo horizonte": "CNF",
  curitiba: "CWB",
  "porto alegre": "POA",
  // Portugal
  lisboa: "LIS",
  porto: "OPO",
  faro: "FAO",
  // Spain
  madri: "MAD",
  madrid: "MAD",
  barcelona: "BCN",
  sevilha: "SVQ",
  sevilla: "SVQ",
  malaga: "AGP",
  // Turkey
  istambul: "IST",
  ancara: "ESB",
  // Morocco
  casablanca: "CMN",
  marrakech: "RAK",
  tanger: "TNG",
  // Sri Lanka
  colombo: "CMB",
  // Taiwan
  taipei: "TPE",
  // Europe (others)
  "nova york": "JFK",
  "new york": "JFK",
  londres: "LHR",
  london: "LHR",
  paris: "CDG",
  roma: "FCO",
  rome: "FCO",
  berlim: "BER",
  berlin: "BER",
  amsterda: "AMS",
  amsterdam: "AMS",
  // North America (ADR-033)
  "los angeles": "LAX",
  "cidade do mexico": "MEX",
  "mexico city": "MEX",
  toronto: "YYZ",
  chicago: "ORD",
  // Asia (ADR-033)
  toquio: "HND",
  tokyo: "HND",
  pequim: "PEK",
  beijing: "PEK",
  xangai: "PVG",
  shanghai: "PVG",
  seul: "ICN",
  seoul: "ICN",
  singapura: "SIN",
  singapore: "SIN",
  bangkok: "BKK",
  dubai: "DXB",
  bombaim: "BOM",
  mumbai: "BOM",
  "nova deli": "DEL",
  delhi: "DEL",
  "hong kong": "HKG",
  // Oceania (ADR-033)
  sydney: "SYD",
  melbourne: "MEL",
  auckland: "AKL",
  // Africa (ADR-033)
  joanesburgo: "JNB",
  johannesburg: "JNB",
  cairo: "CAI",
  nairobi: "NBO",
  lagos: "LOS",
};

export function cityToIata(city: string): string | null {
  const normalized = city.toLowerCase().trim();
  return CITY_TO_IATA[normalized] || null;
}
```

Fallback: If the city is not in the table, extractIntent falls back to the LLM's own IATA knowledge, validated by a 3-letter uppercase regex before being accepted (ADR-033) — the table remains the deterministic fast path, the LLM is only a fallback for the long tail.
Future scale: Replace with a geocoding API (Google Places, GeoNames) when justified.

### 6.4 Robust JSON Parser (Retry)

```typescript
// src/domain/json-parser.ts
import { z } from "zod";

export function safeJsonParse<T>(
  content: string,
  schema: z.ZodSchema<T>,
  maxRetries: number = 2,
): { success: true; data: T } | { success: false; error: string } {
  let lastError = "";
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const jsonStr =
        attempt === 0 ? content : content.match(/\{[\s\S]*\}/)?.[0] || content;
      const parsed = JSON.parse(jsonStr);
      const validated = schema.parse(parsed);
      return { success: true, data: validated };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "unknown";
    }
  }
  return { success: false, error: lastError };
}
```

Fallbacks per node:

| Node                 | If JSON fails                                         | Behavior            |
| -------------------- | ----------------------------------------------------- | ------------------- |
| extractIntent        | Returns an empty intent + full missing_info           | Goes to clarify     |
| recommendDestination | Returns the first RAG destination with confidence 0.5 | Never breaks        |
| buildResponse        | Returns a generic error message                       | Shall we try again? |

---

## 7. Experience State Machine

```
IDLE (landing page)
  └── user clicks "Start" ──► CHATTING

CHATTING (chat open, user in control)
  └── message sent ──► THINKING

THINKING (short autoplay, max 3s, guaranteed timeout)
  ├── 3s timeout ──► "try again" fallback
  └── agent decides on a destination ──► FLYTHROUGH

FLYTHROUGH (autoplay, CAMERA_PATH timeline, 12s)
  ├── user clicks "Skip" (visible after 3s) ──► REVEAL
  └── playback complete ──► REVEAL

REVEAL (scroll-driven, destination content, 400vh container)
  ├── user clicks "I don't like it, show another" ──► ALTERNATIVE
  └── scroll continues ──► OPTIONS

ALTERNATIVE (short autoplay, 2s)
  └── second destination suggested ──► FLYTHROUGH (new destination)

OPTIONS (scroll-driven, economy→premium card arc)
  └── scroll continues / CTA click ──► CTA

CTA (static, search links + accommodation tip)
  └── "New search" ──► CHATTING
```

Fundamental rules:

1. Each scene has ONE single control mode — never scroll-driven + autoplay simultaneously
2. Scroll-driven ONLY in REVEAL and OPTIONS
3. Autoplay ONLY in THINKING, FLYTHROUGH, and ALTERNATIVE
4. THINKING has a hard 3s timeout — if exceeded, shows an error state with retry
5. The skip button appears in FLYTHROUGH after 3 seconds
6. prefers-reduced-motion: skips straight to REVEAL with static cards
7. "I don't like it" fallback available in REVEAL — triggers the recommendAlternative node in the graph
8. Maximum 1 alternative per session (avoids an infinite loop)

---

## 8. Agent Specification (LangGraph)

### 8.1 State graph

START → extractIntent → validateIntent → clarify (if needed) → retrieveContext → recommendDestination → validateRecommendation → searchFlights → validateFlightResults → buildResponse → END

### 8.2 Nodes

| Node                  | Input                                        | Output                           | Responsibility                                           |
| --------------------- | -------------------------------------------- | -------------------------------- | -------------------------------------------------------- |
| extractIntent         | User message + history                       | TravelIntent                     | Extracts preferences via LLM + detects jailbreak         |
| validateIntent        | TravelIntent                                 | Validated intent or missing_info | Zod schema + checks required fields                      |
| clarify               | Missing fields                               | Natural question                 | Generates ONE short question (max 15 words)              |
| retrieveContext       | TravelIntent                                 | List of destinations             | Similarity search in the RAG                             |
| recommendDestination  | Intent + destinations                        | DestinationRecommendation        | Chooses 1 destination with a confidence score            |
| recommendAlternative  | Intent + destinations + rejected destination | DestinationRecommendation        | Chooses a second destination, excluding the previous one |
| searchFlights         | FlightSearchInput                            | FlightSearchResult               | Calls the MCP, not the API directly                      |
| validateFlightResults | FlightSearchResult                           | Normalized result                | Zod + tier classification                                |
| buildResponse         | All of the data above                        | Final message                    | Formats the cinematic response                           |

Note (ADR-033): whenever `buildResponse` presents a destination, it must include the visa disclaimer from `docs/SECURITY.md` Section 5, the same mechanism already used for the flight price disclaimer — not a new feature, just a second boilerplate line alongside the existing one.

### 8.3 Conditional transitions

```typescript
function shouldClarify(state: AgentState): string {
  if (state.error) return "buildResponse";
  if (state.clarification_needed) return "clarify";
  return "retrieveContext";
}

function hasRecommendation(state: AgentState): string {
  if (state.error) return "buildResponse";
  if (state.recommendation && state.recommendation.confidence < 0.6)
    return "clarify";
  return "searchFlights";
}

function shouldAlternative(state: AgentState): string {
  if (state.experience_state.type === "alternative")
    return "recommendAlternative";
  return "recommendDestination";
}
```

### 8.4 Agent state

```typescript
interface AgentState {
  session_id: string;
  messages: { role: "user" | "assistant"; content: string }[];
  intent: TravelIntent | null;
  clarification_needed: boolean;
  clarification_question: string | null;
  recommendation: DestinationRecommendation | null;
  rejected_destinations: string[]; // for the "I don't like it" fallback
  flights: FlightOption[];
  experience_state: ExperienceState;
  error: string | null;
}
```

---

## 9. RAG Specification

### 9.1 MVP Destinations (5)

| ID          | Name                   | Country   | Main Vibe                        | Budget | Airport |
| ----------- | ---------------------- | --------- | -------------------------------- | ------ | ------- |
| setenil     | Setenil de las Bodegas | Spain     | Romantic, historic, gastronomy   | Medium | AGP     |
| mardin      | Mardin                 | Turkey    | Historic, cultural, scenic views | Low    | MQM     |
| sigiriya    | Sigiriya               | Sri Lanka | Adventure, nature, historic      | Low    | CMB     |
| chefchaouen | Chefchaouen            | Morocco   | Quiet, photography, mountains    | Low    | TNG     |
| jiufen      | Jiufen                 | Taiwan    | Nostalgic, gastronomy, mountains | Medium | TPE     |

### 9.2 Embedding Strategy

- Model: Google Gemini embeddings (same API key as the LLM)
- Text to embed: name + ". " + vibe_description + " Tags: " + tags.join(", ") + ". Best for: " + best_for.join(", ")
- Storage: SQLite (destinations table with an embedding column as a float32 vector BLOB)
- Retrieval: manual in-memory cosine similarity (5 destinations x 1536 dims = trivial computation)
- Metadata: JSON string with the full Destination object

Note: With 5 destinations, we don't need a vector index. When scaling to 50+ destinations, we migrate to Postgres + pgvector — same SQL schema, a 2-line change.

### 9.3 Curation Checklist (per destination)

- Coordinates validated in MapLibre
- Waypoints tested (camera does not clip through terrain)
- Cost-of-living data verified in 2+ sources (Numbeo, BudgetYourTrip)
- Best season cross-checked against real weather
- Budget neighborhood validated against recent travel blogs
- Attractions with an English description
- Visa note (if applicable)
- Nearest airport + validated IATA code

---

## 10. MCP Specification

### 10.1 Adapter Pattern

Agent → MCP Client → MCP Flight Server → FlightSearchService → FlightProvider
├── MockFlightAdapter (default, zero cost)
└── DuffelAdapter (once an account/token exists)

Swapping adapters: 1 line in the FlightSearchService:

```typescript
const provider = new MockFlightAdapter(); // MVP
// const provider = new DuffelAdapter(); // Future
```

### 10.2 MockFlightAdapter

Generates realistic fictional flights based on deterministic rules:

- 3 options per search: economy (1-2 stops, low price), intermediate (1 stop, medium price), premium (direct, high price)
- Prices vary by route (GRU→AGP vs GRU→CMB)
- Real airlines: TAP, LATAM, Emirates, Qatar Airways, Turkish Airlines, etc.
- Dates/times consistent with time zones
- Disclaimer: every option includes the note "Indicative price (demo) — subject to change"

### 10.3 Tool Contract

Input: FlightSearchInput (see Section 6.1)
Output: FlightSearchResult (see Section 6.1)

### 10.4 Tier Classification (Deterministic)

```typescript
function classifyTier(option: FlightOption): Tier {
  const price = option.price.total;
  const stops = option.outbound.stops;
  if (stops >= 2 && price < 300) return "economy";
  if (stops === 0 && price > 800) return "premium";
  if (stops === 0 && price > 400) return "intermediate";
  if (stops === 1 && price < 400) return "economy";
  return "intermediate";
}
```

Rule: price classification is logic, not AI (Module 8 of the syllabus).

### 10.5 Failure Flow

| Scenario                 | Behavior                                                                        |
| ------------------------ | ------------------------------------------------------------------------------- |
| Adapter returns an error | Retry once with a 1s backoff → if it fails, success: false + a friendly message |
| No flights found         | success: true, options: [] + an alternative airport suggestion                  |
| Timeout > 8s             | Cancels the request, success: false, "We searched for alternatives"             |
| 5 consecutive errors     | Circuit breaker open for 5 minutes                                              |

### 10.6 Rate Limiting & Cost

- Hard limit: 100 searches/day on the public demo
- Estimated cost: $0 (Mock Adapter) or ~$0.005/search (Duffel)
- Alert: 80% of the daily limit triggers a warning log
- Spending cap: $0 in the MVP (Mock) / $50/month once Duffel is activated

---

## 11. Cinematic Specification

### 11.1 Pilot Flythrough: Setenil de las Bodegas

| Waypoint | Coordinates [lng, lat] | Zoom | Pitch | Bearing | Duration | Hold   |
| -------- | ---------------------- | ---- | ----- | ------- | -------- | ------ |
| 1        | [-5.179, 36.786]       | 14   | 60°   | 0°      | 4000ms   | 1000ms |
| 2        | [-5.180, 36.787]       | 16   | 70°   | 90°     | 4000ms   | —      |
| 3        | [-5.178, 36.785]       | 13   | 45°   | 180°    | 3000ms   | —      |

Total duration: ~12s
Color grade: warm_andalusian — CSS filter: sepia(0.2) contrast(1.1) saturate(1.2)
Overlay: linear-gradient(to bottom, rgba(255,200,100,0.1), rgba(0,0,0,0.3))

### 11.2 Implementation rules

- MapLibre GL JS with OpenFreeMap tiles (https://tiles.openfreemap.org/styles/liberty)
- attributionControl: true — mandatory (OSM license)
- Lazy load: the map is only instantiated when FLYTHROUGH is activated
- Mandatory cleanup on unmount: map.remove() + cancel animation frames
- Interruptible playback — AbortController to cancel pending waypoints
- Skip button: absolute position bottom-right, appears with opacity: 0 → 1 after 3s

### 11.3 prefers-reduced-motion Fallback

- Skips the entire flythrough
- Goes straight to REVEAL with a static image of the destination + info cards

### 11.4 HUD Overlay (real waypoint data)

Fixed overlay during the flythrough, bottom-left position (the skip button occupies bottom-right), displaying the data the controller already computes per waypoint. It is not a new feature — it is a presentation of the existing data from table 11.1.

Content (updates on every waypoint change):

```
COORD  {lng}°W  {lat}°N
ALT    ZOOM {zoom} · PITCH {pitch}° · BRG {bearing}°
DEST   {destination name}
```

Style:

- Monospaced font, opacity 0.6-0.7
- Color derived from the destination's active color grade (e.g., warm_andalusian → a warm tone), never a generic white
- No entrance/exit animation of its own — syncs with the controller's waypoint change

Implementation rules:

- A separate component (`cinematic/HudOverlay.tsx`), listens to the flythrough controller's current state — not coupled to the agent, RAG, or MCP
- Disappears along with the rest of the flythrough in the prefers-reduced-motion fallback (Section 11.3) — does not appear on the static REVEAL
- Cleanup on unmount, alongside the rest of the flythrough controller (Section 11.2)

Estimated effort: half a day.

### 11.5 Data pattern for the remaining destinations (ADR-008 — Destination as Data)

The MVP's RAG has 5 destinations (Section 9.1: Setenil, Mardin, Sigiriya, Chefchaouen, Jiufen). Section 11.1 only specifies waypoints for Setenil (the pilot). The other 4 follow the same interface — a new destination is configuration, never a new renderer — but the concrete values for each one have not yet been curated and tested (see checklist 9.3: "Waypoints tested (camera does not clip through terrain)" still pending for them).

Normative structure (one file per destination, `src/cinematic/destinations/<id>.ts`):

```typescript
export interface FlythroughWaypoint {
  center: [number, number]; // [lng, lat]
  zoom: number;
  pitch: number;
  bearing: number;
  duration: number; // ms of transition to this waypoint
  hold?: number; // ms of pause at this waypoint before the next
}

export interface DestinationFlythrough {
  waypoints: FlythroughWaypoint[]; // total duration must add up to ~12s (ADR-014)
  grade: {
    filter: string; // CSS filter applied to the MapLibre canvas
    overlay: string; // CSS gradient, mixBlendMode "overlay"
  };
}
```

`setenil.ts` (frozen values, Section 11.1 — this is the source of truth; any other file with different values for Setenil is outdated):

```typescript
export const setenil: DestinationFlythrough = {
  waypoints: [
    {
      center: [-5.179, 36.786],
      zoom: 14,
      pitch: 60,
      bearing: 0,
      duration: 4000,
      hold: 1000,
    },
    {
      center: [-5.18, 36.787],
      zoom: 16,
      pitch: 70,
      bearing: 90,
      duration: 4000,
    },
    {
      center: [-5.178, 36.785],
      zoom: 13,
      pitch: 45,
      bearing: 180,
      duration: 3000,
    },
  ],
  grade: {
    filter: "sepia(0.2) contrast(1.1) saturate(1.2)",
    overlay:
      "linear-gradient(to bottom, rgba(255,200,100,0.1), rgba(0,0,0,0.3))",
  },
};
```

> [DECISION REQUIRED] — `mardin.ts`, `sigiriya.ts`, `chefchaouen.ts`, and `jiufen.ts` do not yet have waypoints curated or validated against the Section 9.3 checklist. There is an earlier draft with values for Mardin and Sigiriya (6 waypoints, ~23s total duration, grades different from the standard above) that **should not be reused as is** — it was written before ADR-014 (12s cap) and uses a slightly different data interface (`center` vs `coordinates`, extra fields). Decision needed: are the remaining 4 destinations curated now (before the first code commit) following the same 12s cap and the 9.3 checklist, or does the MVP ship with only Setenil functional, with the other 4 appearing in the RAG as text but without their own flythrough (falling back to a static image, same behavior as `prefers-reduced-motion`, Section 11.3) until they are curated in Roadmap Phase 1 (Section 15.3, which already lists "Flythrough for every RAG destination" as a future task)?

---

## 12. Agent Prompts

> Extracted to `docs/PROMPTS.md` (system prompt and extraction/recommendation/clarification/jailbreak templates). The normative source of truth from here on is that file — do not duplicate content here.

---

## 13. Security & Guardrails

> Extracted to `docs/SECURITY.md` (jailbreak detection, mandatory tests, rate limiting, sensitive data, legal disclaimer, evaluated tools). The normative source of truth from here on is that file.

---

## 14. Eval Harness + E2E (Playwright)

> Extracted to `docs/EVAL_HARNESS.md` (test pyramid, eval cases, metrics) and `docs/PLAYWRIGHT.md` (critical flows, E2E directory structure, CI/CD, anti-flaky strategy). The normative source of truth from here on is those files.

## 15. Evolution Roadmap

Trigger to revisit this section: MVP live + 3 freelance conversations OR 500 unique visits.

### 15.1 Unified product vision

Wayreel's ambition is to unify, into a single experience, what is today fragmented across several tools: finding a destination, finding a flight, finding cheap accommodation, building an itinerary.

### 15.2 Pillars of the complete experience

| Pillar                                 | MVP status                               | What's missing to become real                   |
| -------------------------------------- | ---------------------------------------- | ----------------------------------------------- |
| Destination suggested via conversation | Implemented                              | —                                               |
| Economy → premium flight               | Implemented (Mock/Duffel)                | Already real data                               |
| Points of interest and "what to do"    | Curated in the RAG                       | Live/dynamic would require an activities API    |
| Tip on where to stay cheaper           | Curated in the RAG (neighborhood/region) | Real live pricing requires an accommodation API |
| Dynamic itinerary/alternative route    | Out of the MVP                           | Complex content generation                      |
| Live accommodation                     | Out of the MVP                           | A dedicated accommodation API is needed         |
| Price monitoring                       | Out of the MVP                           | Async job, not a chat response                  |
| User account + history                 | Out of the MVP                           | Persistent memory across trips                  |

### 15.3 Phase 1: Product Consolidation

Trigger: MVP live + 3 freelance conversations OR 500 unique visits

| Task                                                   | Rationale                                            |
| ------------------------------------------------------ | ---------------------------------------------------- |
| Expand the RAG to 20-50 destinations                   | Minimum volume so it doesn't look like an empty demo |
| Flythrough for every RAG destination                   | destinationId → config, not new code (ADR-008)       |
| Adjust the flythrough based on feedback                | If recruiters skip it, reduce to 8-10s               |
| Implement the "I don't like it, show another" fallback | Domain gap identified in the MVP                     |
| Add visa notes, airport→city transfer                  | Real-expert gap                                      |
| Travelpayouts Data API integration                     | Price trends to enrich the RAG                       |
| Implement multimodal "vibe" input (screenshot/video)   | Cheapest differentiator to fit in                    |

### 15.4 Phase 2: Monetization and Affiliates

Trigger: 1,000 visits/month OR the first investor/B2B recruiter interest

| Task                                                   | Rationale                                   |
| ------------------------------------------------------ | ------------------------------------------- |
| Classic Duffel/Travelpayouts affiliate program         | 4-20% per booking, aligned with the mission |
| Price-tier schema activating the affiliate network     | Economy → classic; Premium → high ticket    |
| Automatic affiliate link insertion in the conversation | Emerging category (ChatAds/Adgentic)        |

### 15.5 Phase 3: Scalability and Architecture

Trigger: 5,000 visits/month OR the need to support multiple languages

| Task                                          | Rationale                                                |
| --------------------------------------------- | -------------------------------------------------------- |
| Monorepo with separate packages (Turborepo)   | Real reuse across web/api/mcp                            |
| User account + history (Clerk/Auth0)          | The post-trip reflection loop requires persistent memory |
| Multi-language (i18n)                         | Required by international freelance clients              |
| Price-drop monitoring (BullMQ/Agenda)         | The "Going" model, but as a separate feature             |
| Advanced caching (Redis)                      | Reduce Duffel cost at volume                             |
| Small curated RAG → full destination database | 50-100+ destinations                                     |
| SQLite → Postgres + pgvector                  | Vector index for retrieval at scale                      |
| **Re-evaluate Lagune AI**                     | Multiple developers, legacy code, larger attack surface  |

### 15.6 Phase 4: Competitive Differentiation

Trigger: A product with recurring revenue OR a clear B2B opportunity

| Task                                                 | Complexity |
| ---------------------------------------------------- | ---------- |
| Multi-agent consensus for a group                    | High       |
| Granular accessibility in the RAG                    | Low        |
| "Physical window" dimension + less-hyped alternative | Low        |
| Post-trip reflection loop                            | Medium     |

### 15.7 Phase 5: Production Infrastructure

Trigger: Usage volume justifying the cost of paid tools

- Model routing (Claude/OpenAI via OpenRouter)
- Professional observability (LangSmith/Phoenix)
- Full CI/CD (GitHub Actions)
- Load testing (k6/Artillery)
- Self-hosted infrastructure (move off Vercel/Railway if needed)
- SAST gate (Semgrep/Snyk) in CI

### 15.8 Structural domain gaps

Price-drop monitoring: Doesn't fit an instant conversation. It's a real tactic, but it works over days/weeks — it's an async job, not a chat response.

Total trip cost vs. flight only: The product optimizes flight price, but accommodation/transport/food usually weighs more. When scaling, cross-reference the RAG's cost-of-living data with the final suggestion.

---

## 16. Market Analysis

### 16.1 Real competition mapped (2026)

| Player                      | What it does                                                             | Strength                                  |
| --------------------------- | ------------------------------------------------------------------------ | ----------------------------------------- |
| Layla AI                    | Chat-first, complete itinerary with flight/hotel/booking                 | Most complete in 2026 comparisons         |
| Mindtrip                    | Pinterest-style visual destination browsing; launched "Mindtrip Flights" | Strong visual production, community       |
| Wanderlog                   | Map-first, collaborative, +1M users                                      | Visual/shared planning                    |
| SearchSpot                  | Focused on validating real constraints                                   | Judgment over inspiration                 |
| Booking.com AI Trip Planner | Accommodation giant with conversational chat                             | Distribution and proprietary data         |
| IHG                         | Conversational Search in the hotel app                                   | Proprietary accommodation data            |
| FCM Travel                  | Corporate booking via MCP, directly in Slack/Teams/ChatGPT               | Already shipping in commercial production |

### 16.2 Honest verdict

"Conversational AI for travel" and "MCP for flight search" are no longer unexplored territory — it's what the entire market is building right now, with large, well-funded players.

Don't sell it in an interview as "nobody's done this" — sell it as "I know this crowded market and I chose to build the slice that still has room."

### 16.3 What remains a real differentiator

1. Cinematic visual execution (scroll-driven, single scene, not a grid/mood-board) — no mapped competitor does this
2. The posture of a declared ethical expert (only legitimate tactics, hidden city excluded by a conscious decision) — no competitor positions itself this way
3. The market analysis itself as interview material — mapping the competition and consciously choosing where to compete is more mature than claiming originality

### 16.4 Recalibrate the narrative, don't discard the idea

Sufficient for a portfolio (a validated category = a recruiter understands the problem without extra explanation). Not sufficient on its own as a startup thesis — the competition has integrated Sabre and millions of users; to become a real product, it needs more than "a pretty version."

---

## 17. ADRs (Architecture Decision Records)

| ADR                                                  | Decision                                                                                                                                                                              | Status     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| ADR-001                                              | Single agent (LangGraph)                                                                                                                                                              | Frozen     |
| ADR-002                                              | LangGraph orchestration                                                                                                                                                               | Frozen     |
| ADR-003                                              | MCP for flight search                                                                                                                                                                 | Frozen     |
| ADR-004                                              | Flight Provider Adapter (Mock + Duffel)                                                                                                                                               | Frozen     |
| ADR-005                                              | Simple RAG (SQLite, trivial migration to Postgres)                                                                                                                                    | Frozen     |
| ADR-006                                              | MapLibre as primary, Three.js only if needed                                                                                                                                          | Frozen     |
| ADR-007                                              | Motion and Grade are independent                                                                                                                                                      | Frozen     |
| ADR-008                                              | Destination as Data                                                                                                                                                                   | Frozen     |
| ADR-009                                              | Mandatory eval harness                                                                                                                                                                | Frozen     |
| ADR-010                                              | Supervised AI-assisted development                                                                                                                                                    | Frozen     |
| ADR-011                                              | Flat structure in the MVP                                                                                                                                                             | Frozen     |
| ADR-012                                              | SSE for communication                                                                                                                                                                 | Frozen     |
| ADR-013                                              | SQLite (serverless file, trivial migration)                                                                                                                                           | Frozen     |
| ADR-014                                              | Flythrough capped at 12s with skip                                                                                                                                                    | Frozen     |
| ADR-015 _(revised 2026-08-28)_                       | Gemini 3.5 Flash as the primary LLM, Gemini 3.1 Flash-Lite as the rate-limit fallback (free tier)                                                                                     | Frozen     |
| ADR-016                                              | Express as the backend framework                                                                                                                                                      | Frozen     |
| ADR-017                                              | Name: Wayreel                                                                                                                                                                         | Frozen     |
| ADR-018                                              | MockFlightAdapter as the default, Duffel optional                                                                                                                                     | Frozen     |
| ADR-019                                              | Static city→IATA lookup table                                                                                                                                                         | Frozen     |
| ADR-020                                              | "I don't like it, show another" fallback                                                                                                                                              | Frozen     |
| ADR-021                                              | Malformed JSON retry with Zod                                                                                                                                                         | Frozen     |
| ADR-022                                              | Single documentation (not duplicated)                                                                                                                                                 | Frozen     |
| ADR-023                                              | Zero total cost in the MVP                                                                                                                                                            | Frozen     |
| **ADR-024**                                          | **Playwright for E2E, not Lagune AI in the MVP**                                                                                                                                      | **Frozen** |
| **ADR-025** _(revised 2026-08-30 — second revision)_ | **Claude Code as the development environment, with native PreToolUse/PostToolUse hooks + Husky/gitleaks in pre-commit (layered defense)**                                             | **Frozen** |
| **ADR-026**                                          | **HUD overlay in the flythrough showing real waypoint data (coord/zoom/pitch/bearing)**                                                                                               | **Frozen** |
| **ADR-027**                                          | **Operational documentation (prompts, security, eval, E2E) extracted into dedicated files under `docs/`; CLAUDE.md created at the root for code agent rules**                         | **Frozen** |
| **ADR-028**                                          | **Design tokens synthesized from the visual references (docs/DESIGN_TOKENS.md)**                                                                                                      | **Frozen** |
| **ADR-029**                                          | **Styling via CSS custom properties (src/ui/tokens.css), not Tailwind**                                                                                                               | **Frozen** |
| **ADR-030**                                          | **Responsiveness: single breakpoint at 768px, flight cards stack on mobile, no flythrough quality reduction per device, every interaction needs a touch equivalent (not just hover)** | **Frozen** |
| **ADR-031**                                          | **Repository content is English-only; agent conversation supports PT/EN/ES via system prompt, no UI i18n or RAG duplication in MVP**                                                  | **Frozen** |
| **ADR-033**                                          | **Product is global, not Brazil-specific — city coverage expanded with LLM fallback; visa data becomes a generic per-nationality disclaimer, not fixed per-destination facts**        | **Frozen** |

### 17.1 Revision Log

**ADR-015 — revised 2026-08-28**

- Problem: Gemini 1.5 Flash, the originally specified model, was discontinued by Google.
- Impact: the tech stack would reference a nonexistent model before even the first code commit.
- Alternatives evaluated: keep 1.5 Flash and swap only at implementation time (rejected — the doc would stop being the source of truth); use Gemini 3.1 Pro Preview as the sole model (rejected — free tier too restricted for daily use).
- Decision: Gemini 3.5 Flash as the primary model, Gemini 3.1 Flash-Lite as the rate-limit fallback. Confirm the account's real limit at aistudio.google.com/rate-limit before coding — published numbers change frequently.

**ADR-025 — revised 2026-08-28 (first revision, superseded 2026-08-30)**

- Problem: the original decision assumed Claude Code (paid) as the development environment, with native PreToolUse/PostToolUse hooks.
- Impact: the author had migrated to a 100% free stack (Cline); Cline has no native hook in the same format as Claude Code.
- Decision at the time: Husky + gitleaks cover secret scanning and lint in pre-commit. Manual Cline approval (Plan/Act, no auto-approve) replaces the native hooks.

**ADR-025 — revised 2026-08-30 (second revision — current decision)**

- Problem: the author confirmed development will happen with Claude Code, not Cline.
- Impact: the previous decision (Cline + manual approval, no native hooks) is superseded. Claude Code's native PreToolUse/PostToolUse hooks are once again the real approval barrier for terminal commands and file edits.
- Alternatives evaluated: keep only manual approval without native hooks (rejected — native hooks are a strictly stronger safety net when available); remove Husky/gitleaks now that a native hook exists (rejected — they are independent layers: the native hook depends on the agent running, pre-commit always runs, including on manual edits).
- Decision: Claude Code with native PreToolUse/PostToolUse hooks as the development environment. Husky + gitleaks remain active in pre-commit as a second layer. Detailed operational rules in `CLAUDE.md`, at the root of the repository.

**ADR-027 — 2026-08-30**

- Problem: agent prompts, security guardrails, and test specs were embedded inside the single 1200+ line document, alongside product vision, architecture, and roadmap — isolated-lookup, high-change-frequency content competing for space with stable content.
- Alternatives evaluated: keep everything in one file (rejected — makes targeted lookup harder and bloats the context loaded by the AI for any task); go back to a broad modular structure of parallel product documents, like PRD/ARCHITECTURE/UI/SECURITY/TESTING (rejected — this is exactly the pattern that caused the conflict between `documentacao-mvp.md` and `documentacao-escala.md` before ADR-022; do not repeat the mistake).
- Decision: extract only genuinely operational content (prompts, security, eval, E2E) into `docs/PROMPTS.md`, `docs/SECURITY.md`, `docs/EVAL_HARNESS.md`, and `docs/PLAYWRIGHT.md` — these are extractions of the same single document, not a second source of truth. Vision, architecture, domain, agent, RAG, MCP, cinematic, ADRs, and roadmap remain in `WAYREEL.md`. Code agent behavior rules (a different category from product content) go into the new `CLAUDE.md`. The earlier drafts (`documentacao-mvp.md`, `documentacao-escala.md`, `AI_ARCHITECTURE_BLUEPRINT.md`, `cinematic-flythrough-maplibre.md`) are removed from the working repository — Git history (a public repository since the first commit, ADR-023) already preserves the evolution; an archive folder in the working tree would only recreate the risk of the AI reading an already-reverted decision.

**ADR-028 — 2026-08-31**

- Problem: no UI palette/typography had been defined; Section 11 already froze the flythrough's ambient light (#ffb37a) but nothing connected that to the rest of the interface.
- Alternatives evaluated: build a full Design System with component variants (rejected — disproportionate for a solo, single-screen-per-scene MVP, contradicts the simplicity priority); copy the palette from one of the 4 visual references directly (rejected — would create undue visual resemblance to a third-party brand, and none of them use a background with the same chromatic bias as Wayreel's already-frozen color grade).
- Decision: minimal tokens (color, typography, spacing, motion) in docs/DESIGN_TOKENS.md, with the accent color reusing the value already frozen in Section 11 instead of introducing a new one.

**ADR-029 — 2026-08-31**

- Problem: package.json had tailwindcss as a devDependency with no architectural decision recorded — it was added by mistake during the initial scaffold generation.
- Alternatives evaluated: keep Tailwind with a customized theme (rejected — an unnecessary dependency and configuration layer for the MVP's component volume, contradicts the simplicity priority).
- Decision: plain CSS custom properties (src/ui/tokens.css), consumed via var(--token) in components. Zero new dependency.

**ADR-030 — 2026-08-31**

- Problem: no responsiveness decision existed in the project, despite most of the target audience accessing it via a mobile browser.
- Alternatives evaluated: multiple breakpoints (tablet/desktop/mobile) (rejected — unnecessary granularity for the MVP's screen count); device detection with flythrough quality reduction on weak hardware (rejected for now — real complexity disproportionate for a 10-12 day MVP; the skip button (Section 11.2) and the prefers-reduced-motion fallback (Section 11.3) already cover the poor-performance case; re-evaluate only if real testing on a weak device shows the need).
- Decision: a single breakpoint at 768px (already implemented in src/ui/tokens.css); flight cards (Section 8, OPTIONS screen) stack in a single column below 768px instead of the desktop arc; no interaction may depend exclusively on :hover — every element with a hover-reveal needs a visible/actionable state for touch.

**ADR-031 — 2026-09-01**

- Problem: repository content had been written in Portuguese despite the project being global/portfolio-facing; separately, Wayreel's real target users may write in Portuguese, English, or Spanish.
- Alternatives evaluated: full UI internationalization + RAG content curated in 3 languages (rejected — disproportionate effort for a solo MVP, contradicts the simplicity priority, triples the destination curation workload which is already the project's real bottleneck); keeping both documentation and product English-only (rejected — loses a genuinely low-cost differentiator, since the LLM agent already understands and generates fluent PT/EN/ES without any extra engineering).
- Decision: all repository content (code, comments, documentation, commit messages, GitHub issues) is English-only from this point. The agent's conversation layer supports Portuguese, English, and Spanish through a single system prompt instruction (respond in the user's language, default English if ambiguous) — no UI translation, no RAG duplication in the MVP.

**ADR-033 — 2026-09-01**

- Problem: initial implementation (CITY_TO_IATA table, destination visa fields) assumed a Brazilian traveler, but the product is meant to be global.
- Alternatives evaluated: building a full nationality × destination visa database (rejected — scope explosion disproportionate to a solo MVP, visa data changes over time and needs constant upkeep); keeping the static table as the only city resolution mechanism (rejected — no static table can cover global input, and expanding it indefinitely doesn't scale).
- Decision: (1) CITY_TO_IATA expanded to include major cities across all continents, not just Brazil/Europe. When a city isn't in the table, extractIntent falls back to the LLM's own knowledge of IATA codes, validated by a 3-letter uppercase regex before being accepted — the table remains the deterministic fast path, the LLM is only a fallback for the long tail. (2) Visa information becomes a generic disclaimer ("requirements vary by nationality — confirm with your consulate"), not a fixed fact per destination, since visa rules depend on the traveler's passport, not the destination alone.

---

## 18. Pre-Launch Checklist

- [ ] Google AI Studio account created + API key generated
- [ ] 5 destinations curated in the RAG (data verified, embeddings generated)
- [ ] Flythrough functional for 1 destination (Setenil, 3 waypoints, 12s, skip button)
- [ ] **HUD overlay functional (coord/zoom/pitch/bearing updating per waypoint)**
- [ ] Eval harness running and passing (>= 80%)
- [ ] Security guardrails tested (100% pass rate)
- [ ] Rate limit + spending cap active
- [ ] prefers-reduced-motion tested
- [ ] MapLibre attribution visible on every screen with a map
- [ ] Indicative price notice in the UI
- [ ] "I don't like it, show another" fallback implemented and tested
- [ ] City→IATA mapping tested (30 main cities)
- [ ] Malformed JSON retry tested
- [ ] Public GitHub repository with a complete README
- [ ] Vercel deploy working (wayreel.vercel.app)
- [ ] Short GIF/video of the flow working (to attach in outreach)
- [ ] **Playwright E2E running and passing in CI (critical flows)**
- [ ] **GitHub Actions E2E workflow configured**
- [ ] **Husky pre-commit hooks active**
- [ ] **Claude Code's native PreToolUse/PostToolUse hooks configured (ADR-025)**
- [ ] **CLAUDE.md and docs/ (PROMPTS, SECURITY, EVAL_HARNESS, PLAYWRIGHT) created and reviewed**

---

## 19. Immediate Next Steps

0. **Documentation (ADR-027):** `WAYREEL.md`, `CLAUDE.md`, and `docs/` (PROMPTS, SECURITY, EVAL_HARNESS, PLAYWRIGHT) already generated. Remove `documentacao-mvp.md`, `documentacao-escala.md`, `AI_ARCHITECTURE_BLUEPRINT.md`, and `cinematic-flythrough-maplibre.md` from the working repository — content already absorbed, history preserved in Git (ADR-023).
1. Create a Google AI Studio account → https://aistudio.google.com → generate an API key
2. Create a public GitHub repository → add .gitignore → initial commit with README
3. Create a Vercel account → connect with GitHub
4. Local setup: npm init, install dependencies, configure .env
5. **Install and configure Playwright: npm init playwright@latest**
6. **Configure Husky + pre-commit hooks**
7. Implement the domain layer (types, schemas, airport-codes, json-parser)
8. Curate 5 destinations (complete data in src/rag/destinations.ts)
9. Implement the RAG (retriever + seed)
10. Implement the MCP (Mock adapter + structured Duffel adapter + flight tool)
11. Implement the Agent (LangGraph nodes including recommendAlternative + graph)
12. Implement the API (Express + SSE)
13. Implement Cinematic (flythrough controller + waypoints)
14. Implement the UI (React components with the ALTERNATIVE state)
15. Implement Eval (10 cases + runner)
16. **Write Playwright E2E tests (happy path, jailbreak, alternative, accessibility)**
17. Test security (7 jailbreak cases)
18. **Configure GitHub Actions for E2E**
19. Deploy to Vercel
20. Record a video of the flow for outreach

Total estimate: 10-12 days of focused, full-time development.
