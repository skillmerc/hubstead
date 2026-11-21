import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { and, eq } from "drizzle-orm";

import logger from "@/utils/logger";

import { db } from "../../../db/index";
import { namespaceToolMappingsTable, toolsTable } from "../../../db/schema";
import { parseToolName } from "../tool-name-parser";
import {
  CallToolMiddleware,
  ListToolsMiddleware,
} from "./functional-middleware";
import { findNamespaceServerByPrefix } from "./namespace-server-lookup";
import { mapOverrideNameToOriginal } from "./tool-overrides.functional";

/**
 * Configuration for the filter middleware
 */
export interface FilterToolsConfig {
  cacheEnabled?: boolean;
  cacheTTL?: number; // milliseconds
  customErrorMessage?: (toolName: string, reason: string) => string;
}

/**
 * Tool status cache for performance
 */
class ToolStatusCache {
  private cache = new Map<string, "ACTIVE" | "INACTIVE">();
  private expiry = new Map<string, number>();
  private ttl: number;

  constructor(ttl: number = 1000) {
    this.ttl = ttl;
  }

  private getCacheKey(
    namespaceUuid: string,
    toolName: string,
    serverUuid: string,
  ): string {
    return `${namespaceUuid}:${serverUuid}:${toolName}`;
  }

  get(
    namespaceUuid: string,
    toolName: string,
    serverUuid: string,
  ): "ACTIVE" | "INACTIVE" | null {
    const key = this.getCacheKey(namespaceUuid, toolName, serverUuid);
    const expiry = this.expiry.get(key);

    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.expiry.delete(key);
      return null;
    }

    return this.cache.get(key) || null;
  }

  set(
    namespaceUuid: string,
    toolName: string,
    serverUuid: string,
    status: "ACTIVE" | "INACTIVE",
  ): void {
    const key = this.getCacheKey(namespaceUuid, toolName, serverUuid);
    this.cache.set(key, status);
    this.expiry.set(key, Date.now() + this.ttl);
  }

  clear(namespaceUuid?: string): void {
    if (namespaceUuid) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${namespaceUuid}:`)) {
          this.cache.delete(key);
          this.expiry.delete(key);
        }
      }
    } else {
      this.cache.clear();
      this.expiry.clear();
    }
  }
}

// Global cache instance
const toolStatusCache = new ToolStatusCache();

/**
 * Get tool status from database with caching
 */
async function getToolStatus(
  namespaceUuid: string,
  toolName: string,
  serverUuid: string,
  useCache: boolean = true,
): Promise<"ACTIVE" | "INACTIVE" | null> {
  // Check cache first
  if (useCache) {
    const cached = toolStatusCache.get(namespaceUuid, toolName, serverUuid);
    if (cached !== null) {
      return cached;
    }
  }

  try {
    // Query database for tool status
    const [toolMapping] = await db
      .select({
        status: namespaceToolMappingsTable.status,
      })
      .from(namespaceToolMappingsTable)
      .innerJoin(
        toolsTable,
        eq(toolsTable.uuid, namespaceToolMappingsTable.tool_uuid),
      )
      .where(
        and(
          eq(namespaceToolMappingsTable.namespace_uuid, namespaceUuid),
          eq(toolsTable.name, toolName),
          eq(namespaceToolMappingsTable.mcp_server_uuid, serverUuid),
        ),
      );

    const status = toolMapping?.status || null;

    // Cache the result if found and caching is enabled
    if (status && useCache) {
      toolStatusCache.set(namespaceUuid, toolName, serverUuid, status);
    }

    return status;
  } catch (error) {
    logger.error(
      `Error fetching tool status for ${toolName} in namespace ${namespaceUuid}:`,
      error,
    );
    // Rethrow: "could not check" must not read as "no mapping" (allowed).
    throw error;
  }
}

// parseToolName is now imported from shared utility

/**
 * Get the UUID of the namespace server behind a tool-name prefix. Scoped to
 * the namespace, since server names are only unique per user (upstream issue
 * #364). Throws on database errors.
 */
async function getServerUuidByName(
  namespaceUuid: string,
  serverName: string,
): Promise<string | null> {
  const server = await findNamespaceServerByPrefix(namespaceUuid, serverName);
  return server?.uuid ?? null;
}

/**
 * Filter tools based on their status in the namespace
 */
async function filterActiveTools(
  tools: Tool[],
  namespaceUuid: string,
  useCache: boolean = true,
): Promise<Tool[]> {
  if (!tools || tools.length === 0) {
    return tools;
  }

  const activeTools: Tool[] = [];

  await Promise.allSettled(
    tools.map(async (tool) => {
      try {
        const parsed = parseToolName(tool.name);
        if (!parsed) {
          // If tool name doesn't follow expected format, include it
          activeTools.push(tool);
          return;
        }

        const serverUuid = await getServerUuidByName(
          namespaceUuid,
          parsed.serverName,
        );
        if (!serverUuid) {
          // If server not found, include the tool (fallback behavior)
          activeTools.push(tool);
          return;
        }

        const status = await getToolStatus(
          namespaceUuid,
          parsed.originalToolName,
          serverUuid,
          useCache,
        );

        // If no mapping exists or tool is active, include it
        if (status === null || status === "ACTIVE") {
          activeTools.push(tool);
        }
        // If status is "INACTIVE", tool is filtered out
      } catch (error) {
        logger.error(`Error checking tool status for ${tool.name}:`, error);
        // On error, include the tool (fail-safe behavior)
        activeTools.push(tool);
      }
    }),
  );

  return activeTools;
}

/**
 * Check if a tool is allowed to be called
 */
async function isToolAllowed(
  toolName: string,
  namespaceUuid: string,
  serverUuid: string,
  useCache: boolean = true,
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const parsed = parseToolName(toolName);
    if (!parsed) {
      // If tool name doesn't follow expected format, allow it
      return { allowed: true };
    }

    const status = await getToolStatus(
      namespaceUuid,
      parsed.originalToolName,
      serverUuid,
      useCache,
    );

    // If no mapping exists or tool is active, allow it
    if (status === null || status === "ACTIVE") {
      return { allowed: true };
    }

    // Tool is inactive
    return {
      allowed: false,
      reason: "Tool has been marked as inactive in this namespace",
    };
  } catch (error) {
    logger.error(
      `Error checking if tool ${toolName} is allowed in namespace ${namespaceUuid}:`,
      error,
    );
    // Fail closed: a check that could not run does not allow the tool.
    return {
      allowed: false,
      reason: "Tool status could not be checked",
    };
  }
}

/**
 * Creates a List Tools middleware that filters out inactive tools
 */
export function createFilterListToolsMiddleware(
  config: FilterToolsConfig = {},
): ListToolsMiddleware {
  const useCache = config.cacheEnabled ?? true;

  return (handler) => {
    return async (request, context) => {
      // Call the original handler to get the tools
      const response = await handler(request, context);

      // Filter the tools based on namespace tool mappings
      if (response.tools) {
        const filteredTools = await filterActiveTools(
          response.tools,
          context.namespaceUuid,
          useCache,
        );

        return {
          ...response,
          tools: filteredTools,
        };
      }

      return response;
    };
  };
}

/**
 * Creates a Call Tool middleware that blocks calls to inactive tools
 */
export function createFilterCallToolMiddleware(
  config: FilterToolsConfig = {},
): CallToolMiddleware {
  const useCache = config.cacheEnabled ?? true;
  const customErrorMessage =
    config.customErrorMessage ??
    ((toolName: string, reason: string) =>
      `Tool "${toolName}" is currently inactive and disallowed in this namespace: ${reason}`);

  return (handler) => {
    return async (request, context) => {
      const toolName = request.params.name;

      // Check the tool the call will really run: an override alias is mapped
      // back to its original name first (upstream issue #388). If that lookup
      // fails, the gate cannot know which tool will run, so it fails closed.
      let canonicalName = toolName;
      let mappingFailed = false;
      try {
        canonicalName = await mapOverrideNameToOriginal(
          toolName,
          context.namespaceUuid,
          useCache,
          true,
        );
      } catch (error) {
        logger.error(`Error resolving override name for ${toolName}:`, error);
        mappingFailed = true;
      }

      const parsed = parseToolName(canonicalName);
      if (parsed) {
        let decision: { allowed: boolean; reason?: string };
        if (mappingFailed) {
          decision = {
            allowed: false,
            reason: "Tool status could not be checked",
          };
        } else {
          try {
            const serverUuid = await getServerUuidByName(
              context.namespaceUuid,
              parsed.serverName,
            );
            if (serverUuid) {
              decision = await isToolAllowed(
                canonicalName,
                context.namespaceUuid,
                serverUuid,
                useCache,
              );
            } else {
              // Fail closed: the server is not part of this namespace.
              decision = {
                allowed: false,
                reason: "The tool's server is not part of this namespace",
              };
            }
          } catch (error) {
            logger.error(`Error checking tool ${toolName}:`, error);
            decision = {
              allowed: false,
              reason: "Tool status could not be checked",
            };
          }
        }

        if (!decision.allowed) {
          // Return error response instead of calling the handler
          return {
            content: [
              {
                type: "text",
                text: customErrorMessage(
                  toolName,
                  decision.reason || "Unknown reason",
                ),
              },
            ],
            isError: true,
          };
        }
      }

      // Tool is allowed, call the original handler
      return handler(request, context);
    };
  };
}

/**
 * Utility function to clear cache
 */
export function clearFilterCache(namespaceUuid?: string): void {
  toolStatusCache.clear(namespaceUuid);
}
