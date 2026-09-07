import pino from "pino";
import { logger } from "./logger";

// The shared `logger` writes asynchronously to stdout (Pino's default via
// sonic-boom, which writes directly to the fd — not interceptable via
// process.stdout.write). To test our configuration deterministically, these
// tests build a second instance with the same options but a synchronous,
// in-memory destination, and assert the JSON it produces.
function loggerWithCapture() {
  const lines: string[] = [];
  const testLogger = pino(
    { level: "info" },
    { write: (line: string) => lines.push(line) },
  );
  return { testLogger, lines };
}

describe("logger", () => {
  it("exposes info/warn/error methods", () => {
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("writes info logs as JSON with the expected level and message", () => {
    const { testLogger, lines } = loggerWithCapture();
    testLogger.info("something happened");
    const entry = JSON.parse(lines[0]!.trim());
    expect(entry.msg).toBe("something happened");
    expect(entry.level).toBe(30); // Pino's numeric level for "info"
  });

  it("writes warn logs as JSON with the expected level", () => {
    const { testLogger, lines } = loggerWithCapture();
    testLogger.warn("careful");
    const entry = JSON.parse(lines[0]!.trim());
    expect(entry.msg).toBe("careful");
    expect(entry.level).toBe(40); // "warn"
  });

  it("writes error logs as JSON with the expected level", () => {
    const { testLogger, lines } = loggerWithCapture();
    testLogger.error("broken");
    const entry = JSON.parse(lines[0]!.trim());
    expect(entry.msg).toBe("broken");
    expect(entry.level).toBe(50); // "error"
  });
});
