// src/domain/schemas.ts
// Source of truth: WAYREEL.md Section 6.2 (Zod Schemas). Do not add fields
// or validation rules not specified there — see CLAUDE.md "Before any change".

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
