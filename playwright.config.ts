import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for Wayreel.
 * Reference specs: WAYREEL.md Section 14.4 / docs/PLAYWRIGHT.md
 *
 * Decisions that came straight from the documentation:
 * - CI runs headless with 2 workers (docs/PLAYWRIGHT.md, test:e2e:ci command)
 * - Anti-flaky: no fixed sleep, deterministic RAG seed, mocked MCP adapter
 *   (docs/PLAYWRIGHT.md Section 5) — done in global-setup.ts, not here.
 * - Test timeout respects the THINKING state's 3s timeout (WAYREEL.md Section 7)
 *   plus a margin for the agent's execution — see `timeout` below.
 *
 * [DECISION REQUIRED] Ports assumed by framework convention, not an
 * architectural decision frozen in any ADR: Vite (5173) for the frontend,
 * Express (3000, already in .env.example) for the API. If this changes, update
 * `baseURL` and `webServer` below.
 */
export default defineConfig({
  testDir: "./e2e/tests",
  globalSetup: "./e2e/global-setup.ts",

  // eval-10 requires e2e < 15s end-to-end (docs/EVAL_HARNESS.md); a 20s
  // per-test timeout gives margin without masking a real latency regression.
  timeout: 20_000,
  expect: {
    timeout: 5_000,
  },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["list"], ["html", { open: "on-failure" }]],

  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Mobile: the flythrough and prefers-reduced-motion (WAYREEL.md Section 11.3)
    // need to be validated on a small viewport, not just desktop.
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  // Starts the frontend and API together before the suite. reuseExistingServer
  // avoids recreating the server on every local watch; CI always starts fresh.
  webServer: [
    {
      command: "npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "npm run server",
      url: "http://localhost:3000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        // Ensures MockFlightAdapter in tests, never real Duffel (docs/PLAYWRIGHT.md Section 5)
        NODE_ENV: "test",
      },
    },
  ],
});
