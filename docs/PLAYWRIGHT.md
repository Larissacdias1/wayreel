# Wayreel — Playwright E2E Strategy

Extracted from `WAYREEL.md` Section 14.4-14.5 (ADR-027). Normative source of truth for E2E tests. Complements `docs/EVAL_HARNESS.md` (agent quality).

## 1. Critical flows with E2E tests

| ID     | Flow                                                          | Priority    |
| ------ | ------------------------------------------------------------- | ----------- |
| E2E-01 | Full conversation → destination → flythrough → flight options | Required    |
| E2E-02 | "I don't like it, show another" fallback                      | Required    |
| E2E-03 | `prefers-reduced-motion` active → skips flythrough            | Required    |
| E2E-04 | Agent timeout (3s) → error state with retry                   | Required    |
| E2E-05 | Jailbreak attempts → smooth redirect                          | Required    |
| E2E-06 | Input > 2000 chars → rejection                                | Recommended |
| E2E-07 | Rate limiting (10 req/min) → block                            | Recommended |
| E2E-08 | Circuit breaker (5 errors) → friendly message                 | Recommended |
| E2E-09 | New search (CTA "New search") → returns to chat               | Recommended |

## 2. E2E directory structure

```
e2e/
├── fixtures/
│   ├── mock-llm-responses.ts
│   ├── seed-destinations.ts
│   └── mock-flight-results.ts
├── pages/
│   ├── ChatPage.ts
│   ├── FlythroughPage.ts
│   └── TravelOptionsPage.ts
├── tests/
│   ├── happy-path.spec.ts
│   ├── alternative.spec.ts
│   ├── accessibility.spec.ts
│   ├── error-states.spec.ts
│   ├── security/
│   │   ├── jailbreak.spec.ts
│   │   ├── rate-limit.spec.ts
│   │   └── input-validation.spec.ts
│   └── api/
│       └── health.spec.ts
├── playwright.config.ts
└── global-setup.ts
```

## 3. Commands

| Command                  | Context                              |
| ------------------------ | ------------------------------------ |
| `npm run test:e2e`       | Local with UI (headed for debugging) |
| `npm run test:e2e:ci`    | Headless CI with 2 workers           |
| `npm run test:e2e:debug` | Debug mode with Playwright inspector |

## 4. CI/CD (GitHub Actions)

- Run on every PR and push to main
- Use `ubuntu-latest` with Node 20
- Checkout → `npm ci` → install Playwright browsers → `test:e2e:ci`
- Upload HTML report and traces on failure

## 5. Anti-flaky strategy

1. Mock the MCP adapter (`MockFlightAdapter`) — do not depend on Duffel
2. Deterministic SQLite seed — RAG returns the same destinations
3. `data-testid` on critical UI elements
4. `waitFor` with state conditions, never a fixed sleep
5. Each test resets the database and session
6. Explicit timeouts respecting the 3s timeout of the THINKING state

## 6. Execution

```
npm run test:e2e:ci
```

- Runs the full Playwright suite
- Fails CI if any critical flow fails
