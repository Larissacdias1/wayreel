// src/agent/graph.ts
// Source of truth: WAYREEL.md Section 8.1 (state graph), Section 8.3
// (conditional transitions — copied verbatim). #126 DoD: "All conditional
// transitions working, including ALTERNATIVE".
//
// validateIntent and validateRecommendation (both referenced in Section
// 8.1's pipeline) had no owning issue ([DECISION REQUIRED] in Section 8.2)
// — resolved here by implementing them in nodes.ts, since this graph can't
// be wired without them. buildResponse (#125) was also extended to handle
// the clarify path, discovered while wiring this graph — see the note in
// nodes.ts's buildFinalMessage.

import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import {
  extractIntent,
  validateIntent,
  clarify,
  retrieveContext,
  recommendDestination,
  recommendAlternative,
  validateRecommendation,
  searchFlights,
  buildResponse,
} from "./nodes";
import type { AgentState } from "./state";

const GraphState = Annotation.Root({
  session_id: Annotation<AgentState["session_id"]>(),
  messages: Annotation<AgentState["messages"]>(),
  intent: Annotation<AgentState["intent"]>(),
  clarification_needed: Annotation<AgentState["clarification_needed"]>(),
  clarification_question: Annotation<AgentState["clarification_question"]>(),
  retrieved_destinations: Annotation<AgentState["retrieved_destinations"]>(),
  recommendation: Annotation<AgentState["recommendation"]>(),
  rejected_destinations: Annotation<AgentState["rejected_destinations"]>(),
  flights: Annotation<AgentState["flights"]>(),
  experience_state: Annotation<AgentState["experience_state"]>(),
  error: Annotation<AgentState["error"]>(),
});

// WAYREEL.md Section 8.3 — copied verbatim.
export function shouldClarify(state: AgentState): string {
  if (state.error) return "buildResponse";
  if (state.clarification_needed) return "clarify";
  return "retrieveContext";
}

export function hasRecommendation(state: AgentState): string {
  if (state.error) return "buildResponse";
  if (state.recommendation && state.recommendation.confidence < 0.6)
    return "clarify";
  return "searchFlights";
}

export function shouldAlternative(state: AgentState): string {
  if (state.experience_state.type === "alternative")
    return "recommendAlternative";
  return "recommendDestination";
}

export function buildGraph() {
  const graph = new StateGraph(GraphState)
    .addNode("extractIntent", extractIntent)
    .addNode("validateIntent", validateIntent)
    .addNode("clarify", clarify)
    .addNode("retrieveContext", retrieveContext)
    .addNode("recommendDestination", recommendDestination)
    .addNode("recommendAlternative", recommendAlternative)
    .addNode("validateRecommendation", validateRecommendation)
    .addNode("searchFlights", searchFlights)
    .addNode("buildResponse", buildResponse)
    .addEdge(START, "extractIntent")
    .addEdge("extractIntent", "validateIntent")
    .addConditionalEdges("validateIntent", shouldClarify, {
      buildResponse: "buildResponse",
      clarify: "clarify",
      retrieveContext: "retrieveContext",
    })
    .addEdge("clarify", "buildResponse")
    .addConditionalEdges("retrieveContext", shouldAlternative, {
      recommendAlternative: "recommendAlternative",
      recommendDestination: "recommendDestination",
    })
    .addEdge("recommendDestination", "validateRecommendation")
    .addEdge("recommendAlternative", "validateRecommendation")
    .addConditionalEdges("validateRecommendation", hasRecommendation, {
      buildResponse: "buildResponse",
      clarify: "clarify",
      searchFlights: "searchFlights",
    })
    .addEdge("searchFlights", "buildResponse")
    .addEdge("buildResponse", END);

  return graph.compile();
}
