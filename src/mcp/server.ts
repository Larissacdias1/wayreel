// src/mcp/server.ts
// Source of truth: WAYREEL.md Section 4 (Stack: "MCP | Custom server
// (@modelcontextprotocol/sdk)"), Section 10.1 (MCP Flight Server), 10.3
// (Tool Contract: Input FlightSearchInput, Output FlightSearchResult).
//
// [DECISION REQUIRED] WAYREEL.md never specifies the MCP transport (stdio,
// SSE, streamable HTTP). Used StdioServerTransport here — the SDK's default,
// standard choice for a locally-run server process — but this was not an
// explicit product decision; revisit if a different transport turns out to
// be needed once the agent (Sprint 3) actually connects an MCP client.

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { searchFlights } from "./flight-tool";

export const server = new Server(
  { name: "wayreel-flight-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

// Section 10.3: Input FlightSearchInput, Output FlightSearchResult
// (src/domain/types.ts / src/domain/schemas.ts).
const SEARCH_FLIGHTS_TOOL = {
  name: "searchFlights",
  description: "Search for flights between two airports (IATA codes).",
  inputSchema: {
    type: "object",
    properties: {
      origin: { type: "string", description: "Origin IATA code (3 letters)" },
      destination: {
        type: "string",
        description: "Destination IATA code (3 letters)",
      },
      departure_date: { type: "string", description: "YYYY-MM-DD" },
      return_date: { type: "string", description: "YYYY-MM-DD" },
      passengers: { type: "number" },
      class: {
        type: "string",
        enum: ["economy", "premium_economy", "business", "first"],
      },
    },
    required: ["origin", "destination", "departure_date", "passengers"],
  },
};

// Exported directly (not inlined) so tests can call them without needing a
// real transport/connection — see server.test.ts.
export async function handleListTools() {
  return { tools: [SEARCH_FLIGHTS_TOOL] };
}

export async function handleCallTool(request: {
  params: { name: string; arguments?: Record<string, unknown> };
}) {
  if (request.params.name !== "searchFlights") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }
  const result = await searchFlights(request.params.arguments);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result) }],
  };
}

server.setRequestHandler(ListToolsRequestSchema, handleListTools);
server.setRequestHandler(CallToolRequestSchema, handleCallTool);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
