# Wayreel

AI-guided cinematic booking. Conversation → 1 destination → 3D flythrough → flight options (economy → premium).

Author: Larissa Carvalho.

## Documentation

- [`WAYREEL.md`](./WAYREEL.md) — single source of truth: vision, architecture, stack, domain, agent, RAG, MCP, cinematic, ADRs, roadmap.
- [`CLAUDE.md`](./CLAUDE.md) — operational rules for the code agent (Claude Code).
- [`docs/PROMPTS.md`](./docs/PROMPTS.md) — agent prompts.
- [`docs/SECURITY.md`](./docs/SECURITY.md) — guardrails and security.
- [`docs/EVAL_HARNESS.md`](./docs/EVAL_HARNESS.md) — measured agent quality.
- [`docs/PLAYWRIGHT.md`](./docs/PLAYWRIGHT.md) — E2E tests.
- [`docs/VISUAL_REFERENCES.md`](./docs/VISUAL_REFERENCES.md) — visual direction and reference sites.

## Setup

```bash
npm install
cp .env.example .env   # fill in GOOGLE_AI_API_KEY
npm run dev             # frontend (Vite)
npm run server          # backend (Express + SSE)
```

## Scripts

| Command                     | What it does                |
| --------------------------- | --------------------------- |
| `npm run lint` / `lint:fix` | Prettier                    |
| `npm run typecheck`         | TypeScript without emitting |
| `npm run eval`              | Agent eval harness          |
| `npm run test:e2e`          | Playwright (local, headed)  |
| `npm run test:e2e:ci`       | Playwright (CI, headless)   |

Total MVP cost: $0.00 (see `WAYREEL.md`, ADR-023).

## License

MIT — see [`LICENSE`](./LICENSE).
