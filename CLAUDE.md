# Wayreel — Rules for Claude Code

AI-guided cinematic booking. This file is read at the start of every session — keep it short.
Source of truth for product/architecture: `WAYREEL.md`. Do not duplicate its content here.

## Before any change

- ADRs in `WAYREEL.md` Section 17 are **frozen** decisions — do not revert or contradict without explicit justification, recorded in `WAYREEL.md` Section 17.1 in the same format as the existing history (Problem/Impact/Alternatives evaluated/Decision).
- Necessary information that is not in any document → **do not invent it**. Write `[DECISION REQUIRED]` in the code/PR and explain the gap, the options, and why a decision is needed. Do not choose on the project's behalf.
- Domain golden rule (`WAYREEL.md` Section 2): if a clear deterministic rule exists, do not use an LLM. `classifyTier` (Section 10.4) is the normative pattern for this kind of logic.
- `[DECISION REQUIRED]` open in Section 11.5 of `WAYREEL.md`: waypoints for Mardin, Sigiriya, Chefchaouen, and Jiufen have not been curated yet. Do not invent coordinates — follow the checklist in Section 9.3 or apply the static fallback (same behavior as `prefers-reduced-motion`) until they are curated.
- If, during a task, you identify that the correct fix requires going beyond what was explicitly asked (e.g., changing a value the instruction said to preserve), STOP and ask before acting — even if the extension seems obviously right. Explain what you found and why you think it needs to change, and wait for confirmation, unless the task has already explicitly authorized that kind of judgment call.

## Scripts

- `npm run lint` / `npm run lint:fix`
- `npm run typecheck`
- `npm run eval` — agent eval harness (`docs/EVAL_HARNESS.md`)
- `npm run test:e2e` / `npm run test:e2e:ci` — Playwright (`docs/PLAYWRIGHT.md`)

## Conventions

- Flat structure (ADR-011) — do not create `packages/` or a monorepo without real, proven reuse need.
- Zod validates all LLM output and all external API input. Never trust unvalidated JSON from the model.
- `src/domain/` does not import React, LLM SDKs, MapLibre, or Duffel — it is the innermost layer, unaware of infrastructure details.
- `src/agent/` receives RAG context already prepared — it does not know about SQL/SQLite.
- `src/mcp/` decouples the agent from the flight provider — switching from `MockFlightAdapter` to `DuffelAdapter` is a 1-line change (Section 10.1).
- The Cinematic Engine is independent of the agent — the agent only passes `destinationId`, never controls `map.flyTo`, easing, or CSS filters directly.
- A new destination is data, not new code (ADR-008) — see the pattern in `WAYREEL.md` Section 11.5.
- Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`), message in the format `<type>: <short description in English>`, referencing the GitHub issue when applicable — e.g., `feat: implement agent extractIntent (#119)`.
- All repository content (code, comments, docs, commit messages, GitHub issues) must be written in English — the project is global/portfolio-facing. This applies regardless of the language used in the development conversation itself.

## Environment and security (ADR-025)

- Development environment: Claude Code, with native `PreToolUse`/`PostToolUse` hooks as an approval barrier for terminal commands and file edits.
- Husky + gitleaks remain active in pre-commit as a second layer (secret scanning, lint), independent of the tool used for editing.
- Never commit `.env` or any API key. Logs never contain secrets, personal data, or card data — see `docs/SECURITY.md`.

## Where to find what

| I need...                                                                               | File                        |
| --------------------------------------------------------------------------------------- | --------------------------- |
| Product vision, scope, stack, domain, agent, RAG, MCP, cinematic (specs), roadmap, ADRs | `WAYREEL.md`                |
| Agent system prompt and templates                                                       | `docs/PROMPTS.md`           |
| Guardrails, jailbreak, rate limiting, sensitive data                                    | `docs/SECURITY.md`          |
| Eval cases and agent quality metrics                                                    | `docs/EVAL_HARNESS.md`      |
| E2E tests, CI, anti-flaky strategy                                                      | `docs/PLAYWRIGHT.md`        |
| Visual direction / reference sites                                                      | `docs/VISUAL_REFERENCES.md` |
| UI color, typography, spacing, motion                                                   | docs/DESIGN_TOKENS.md       |

## Before considering a task done

1. Run `lint` and `typecheck`.
2. If you touched the agent, run `npm run eval` — fails if security < 100% or accuracy < 80% (`docs/EVAL_HARNESS.md`).
3. If you touched a critical UI flow, run `npm run test:e2e`.
4. Review your own implementation: boundary violations (domain importing UI/SDK), unnecessary complexity, unhandled edge cases. Report before moving on to the next task.
