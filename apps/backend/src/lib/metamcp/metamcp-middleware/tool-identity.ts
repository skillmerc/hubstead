import { parseToolName } from "../tool-name-parser";
import { findNamespaceServerByPrefix } from "./namespace-server-lookup";

export interface ToolIdentity {
  mcpServerUuid?: string;
  mcpServerName?: string;
}

/**
 * Resolve the MCP server behind a tool name for audit rows. The lookup is
 * scoped to the namespace, since server names are only unique per user
 * (upstream issue #364). Without a namespace no server uuid is recorded.
 */
export async function resolveToolIdentity(
  toolName: string,
  namespaceUuid?: string,
): Promise<ToolIdentity> {
  const parsed = parseToolName(toolName);
  if (!parsed) {
    return {};
  }

  const server = namespaceUuid
    ? await findNamespaceServerByPrefix(namespaceUuid, parsed.serverName)
    : null;

  return {
    mcpServerUuid: server?.uuid,
    mcpServerName: server?.name ?? parsed.serverName,
  };
}
