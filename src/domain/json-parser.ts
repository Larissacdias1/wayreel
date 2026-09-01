// src/domain/json-parser.ts
// Source of truth: WAYREEL.md Section 6.4 (Robust JSON Parser / Retry). Do
// not change the retry/return contract — see CLAUDE.md "Before any change".

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
