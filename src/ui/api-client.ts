// src/ui/api-client.ts
// Source of truth: issue #142 DoD — "Consumes /api/stream, updates state by
// event". POST /api/chat + GET /api/stream (SSE via EventSource) — the
// exact two-route design already implemented in src/api/index.ts (#127).
//
// EventSource is a real browser global, unavailable in Jest's "node" test
// environment — this accepts an injectable factory (mirroring
// src/cinematic/motion/playback-controller.ts's mapFactory pattern for the
// same reason: MapLibre's WebGL requirement) so the request/response
// orchestration can be unit-tested without a real EventSource.

import type { FlightOption } from "../domain/types";
import type { ChatMessage } from "./Chat";

export interface StreamPayload {
  message: ChatMessage;
  destinationId: string | null;
  flights: FlightOption[];
  error: string | null;
  clarificationNeeded: boolean;
}

export type EventSourceFactory = (url: string) => EventSource;

const defaultEventSourceFactory: EventSourceFactory = (url) =>
  new EventSource(url);

export async function sendMessage(
  sessionId: string,
  message: string,
  eventSourceFactory: EventSourceFactory = defaultEventSourceFactory,
): Promise<StreamPayload> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId }),
  });

  if (!response.ok) {
    throw new Error(`POST /api/chat failed with status ${response.status}`);
  }

  return new Promise<StreamPayload>((resolve, reject) => {
    const eventSource = eventSourceFactory(
      `/api/stream?session_id=${sessionId}`,
    );

    eventSource.onmessage = (event) => {
      eventSource.close();
      try {
        resolve(JSON.parse(event.data) as StreamPayload);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      reject(new Error("GET /api/stream connection error"));
    };
  });
}
