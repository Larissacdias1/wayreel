// src/observability/logger.ts
// Source of truth: WAYREEL.md Section 4 (Stack: "Observability | Pino
// (structured logger) + custom tracer"). Structured JSON logger with
// info/warn/error levels — Pino's default output is already JSON and it
// natively exposes .info()/.warn()/.error(), so this module just configures
// and exports a single shared instance rather than wrapping it.
//
// Reminder for callers (docs/SECURITY.md Section 4): "Logs NEVER contain:
// API keys, personal data, credit cards". No redaction rules are
// implemented here — no exact field names to redact are documented yet
// (no caller producing that kind of log exists in the codebase so far,
// per CLAUDE.md "do not invent" — see [DECISION REQUIRED] if a caller
// needs to log something that could carry sensitive data).

import pino from "pino";

export const logger = pino({ level: "info" });
