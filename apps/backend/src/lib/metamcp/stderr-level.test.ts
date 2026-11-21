import { describe, expect, it } from "vitest";

import { stderrLogLevel } from "./stderr-level";

// Upstream issue #321: every stderr line of a STDIO server was logged as an
// error, although the MCP spec lets servers use stderr for all logging.

describe("stderrLogLevel", () => {
  it("logs plain stderr output as info", () => {
    expect(stderrLogLevel("Processing request of type CallToolRequest")).toBe(
      "info",
    );
    expect(stderrLogLevel("INFO  Processing request of type ListTools")).toBe(
      "info",
    );
    expect(stderrLogLevel("Server started on stdio")).toBe("info");
  });

  it("keeps lines marked as errors at error", () => {
    expect(stderrLogLevel("ERROR: could not open database")).toBe("error");
    expect(stderrLogLevel("2026-11-21 03:00:00 CRITICAL out of memory")).toBe(
      "error",
    );
    expect(stderrLogLevel('{"level":"error","msg":"bad token"}')).toBe("error");
    expect(stderrLogLevel("time=1 level=error msg=failed")).toBe("error");
    expect(
      stderrLogLevel(
        'Traceback (most recent call last):\n  File "x.py", line 1',
      ),
    ).toBe("error");
  });

  it("logs lines marked as warnings at warn", () => {
    expect(stderrLogLevel("WARNING: deprecated option")).toBe("warn");
    expect(stderrLogLevel("level=warn msg=slow response")).toBe("warn");
  });

  it("does not treat words that only contain error as a marker", () => {
    expect(stderrLogLevel("retrying, error_count=0")).toBe("info");
    expect(stderrLogLevel("no errors found")).toBe("info");
  });
});
