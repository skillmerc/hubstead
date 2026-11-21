import type { MetaMcpLogEntry } from "./log-store";

/**
 * Pick a log level for a chunk a STDIO MCP server wrote to stderr.
 *
 * The MCP spec lets stdio servers use stderr for all logging, not only
 * errors (upstream issue #321), so stderr defaults to "info". A chunk is
 * raised to "warn" or "error" only when it carries a level marker such as
 * "WARNING", "ERROR", "level=error" or a Python traceback.
 */
export function stderrLogLevel(text: string): MetaMcpLogEntry["level"] {
  if (
    /\b(ERROR|CRITICAL|FATAL)\b/.test(text) ||
    /\blevel"?\s*[=:]\s*"?(error|critical|fatal)\b/i.test(text) ||
    /^Traceback \(most recent call last\)/m.test(text)
  ) {
    return "error";
  }
  if (
    /\b(WARN|WARNING)\b/.test(text) ||
    /\blevel"?\s*[=:]\s*"?(warn|warning)\b/i.test(text)
  ) {
    return "warn";
  }
  return "info";
}
