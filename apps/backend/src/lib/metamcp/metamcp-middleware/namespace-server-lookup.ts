import { eq } from "drizzle-orm";

import { db } from "../../../db/index";
import {
  mcpServersTable,
  namespaceServerMappingsTable,
} from "../../../db/schema";

/**
 * Same rule as `sanitizeName` in ../utils: tool names carry the sanitized
 * server name as their prefix.
 */
function sanitizeServerName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * Resolve the MCP server behind a tool-name prefix, scoped to the servers
 * mapped into this namespace (upstream issue #364).
 *
 * Server names are only unique per user, so a lookup by name alone can
 * return another user's server. Only servers mapped into the namespace are
 * considered here. An exact name match wins over a sanitized match.
 *
 * Returns null when no server of the namespace matches. Database errors are
 * thrown so callers can decide whether to fail closed.
 */
export async function findNamespaceServerByPrefix(
  namespaceUuid: string,
  serverPrefix: string,
): Promise<{ uuid: string; name: string } | null> {
  const servers = await db
    .select({ uuid: mcpServersTable.uuid, name: mcpServersTable.name })
    .from(mcpServersTable)
    .innerJoin(
      namespaceServerMappingsTable,
      eq(namespaceServerMappingsTable.mcp_server_uuid, mcpServersTable.uuid),
    )
    .where(eq(namespaceServerMappingsTable.namespace_uuid, namespaceUuid));

  return (
    servers.find((s) => s.name === serverPrefix) ??
    servers.find((s) => sanitizeServerName(s.name) === serverPrefix) ??
    null
  );
}
