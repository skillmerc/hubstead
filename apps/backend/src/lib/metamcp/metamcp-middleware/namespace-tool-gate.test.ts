import { beforeEach, describe, expect, it, vi } from "vitest";

// Regression tests for upstream metatool-ai/metamcp issues:
//   #364 server lookup by name is not scoped to the namespace (filter gate,
//        audit identity, overrides) and the call gate allows on an
//        unresolved server
//   #388 an INACTIVE tool stays callable through its override alias
//
// Level: unit tests of the real middleware functions. The database is an
// in-memory fake that evaluates the eq/and conditions the middleware builds
// (drizzle-orm and the schema are replaced by plain objects). They do not
// prove the SQL Postgres runs, nor a full proxy session.

type Row = Record<string, unknown>;

const fake = vi.hoisted(() => {
  const data: Record<string, Row[]> = {
    mcp_servers: [],
    namespace_server_mappings: [],
    namespace_tool_mappings: [],
    tools: [],
  };
  // Number of upcoming queries on namespace_tool_mappings that fail, to
  // simulate a transient database error.
  const faults = { toolMappingQueries: 0 };

  function table(name: string, cols: string[]) {
    const t: Record<string, unknown> = { __table: name };
    for (const col of cols) t[col] = { __col: true, table: name, col };
    return t;
  }

  function value(x: any, row: Row): unknown {
    return x && x.__col ? row[`${x.table}.${x.col}`] : x;
  }

  function matches(cond: any, row: Row): boolean {
    if (!cond) return true;
    if (cond.op === "and") {
      return cond.conds.filter(Boolean).every((c: any) => matches(c, row));
    }
    if (cond.op === "eq") return value(cond.a, row) === value(cond.b, row);
    throw new Error(`fake db: unsupported condition ${cond.op}`);
  }

  function prefixed(name: string, row: Row): Row {
    return Object.fromEntries(
      Object.entries(row).map(([k, v]) => [`${name}.${k}`, v]),
    );
  }

  function pick(fields: Record<string, any>, row: Row): Row {
    return Object.fromEntries(
      Object.entries(fields).map(([k, c]) => [k, value(c, row)]),
    );
  }

  const db = {
    select(fields: Record<string, any>) {
      let rows: Row[] = [];
      let failThisQuery = false;
      const query: any = {
        from(t: any) {
          if (
            t.__table === "namespace_tool_mappings" &&
            faults.toolMappingQueries > 0
          ) {
            faults.toolMappingQueries -= 1;
            failThisQuery = true;
          }
          rows = data[t.__table].map((r) => prefixed(t.__table, r));
          return query;
        },
        innerJoin(t: any, cond: any) {
          const out: Row[] = [];
          for (const a of rows) {
            for (const b of data[t.__table]) {
              const joined = { ...a, ...prefixed(t.__table, b) };
              if (matches(cond, joined)) out.push(joined);
            }
          }
          rows = out;
          return query;
        },
        where(cond: any) {
          if (failThisQuery) {
            const failed: any = Promise.reject(new Error("db unavailable"));
            failed.limit = () => failed;
            return failed;
          }
          const hits = rows.filter((r) => matches(cond, r));
          const result = hits.map((r) => pick(fields, r));
          const promise: any = Promise.resolve(result);
          promise.limit = (n: number) => Promise.resolve(result.slice(0, n));
          return promise;
        },
      };
      return query;
    },
  };

  const schema = {
    mcpServersTable: table("mcp_servers", ["uuid", "name", "user_id"]),
    namespaceServerMappingsTable: table("namespace_server_mappings", [
      "namespace_uuid",
      "mcp_server_uuid",
      "status",
    ]),
    namespaceToolMappingsTable: table("namespace_tool_mappings", [
      "namespace_uuid",
      "tool_uuid",
      "mcp_server_uuid",
      "status",
      "override_name",
      "override_title",
      "override_description",
      "override_annotations",
    ]),
    toolsTable: table("tools", ["uuid", "name", "mcp_server_uuid"]),
  };

  return { data, db, faults, schema };
});

vi.mock("drizzle-orm", () => ({
  eq: (a: unknown, b: unknown) => ({ op: "eq", a, b }),
  and: (...conds: unknown[]) => ({ op: "and", conds }),
}));
vi.mock("../../../db/index", () => ({ db: fake.db }));
vi.mock("../../../db/schema", () => fake.schema);
vi.mock("@/utils/logger", () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { createFilterCallToolMiddleware } from "./filter-tools.functional";
import { compose } from "./functional-middleware";
import { resolveToolIdentity } from "./tool-identity";
import {
  createToolOverridesCallToolMiddleware,
  createToolOverridesListToolsMiddleware,
} from "./tool-overrides.functional";

const NS = "ns-a";
const OTHER_USER_SERVER = "srv-other-user";
const NS_SERVER = "srv-in-namespace";
const NOTES = "srv-notes";
const noCache = { cacheEnabled: false };
const context = { namespaceUuid: NS, sessionId: "s", endpointName: "e" };

function seedSameNameServers() {
  // Two users each own a server called "github" (allowed by the schema).
  // The other user's row comes first, so a name-only lookup returns it.
  fake.data.mcp_servers.push(
    { uuid: OTHER_USER_SERVER, name: "github", user_id: "user-b" },
    { uuid: NS_SERVER, name: "github", user_id: "user-a" },
  );
  fake.data.namespace_server_mappings.push({
    namespace_uuid: NS,
    mcp_server_uuid: NS_SERVER,
    status: "ACTIVE",
  });
  fake.data.tools.push({
    uuid: "tool-delete",
    name: "delete_repo",
    mcp_server_uuid: NS_SERVER,
  });
}

function seedNotes() {
  fake.data.mcp_servers.push({
    uuid: NOTES,
    name: "notesvc",
    user_id: "user-a",
  });
  fake.data.namespace_server_mappings.push({
    namespace_uuid: NS,
    mcp_server_uuid: NOTES,
    status: "ACTIVE",
  });
  fake.data.tools.push(
    { uuid: "t-purge", name: "purge_records", mcp_server_uuid: NOTES },
    { uuid: "t-add", name: "add_note", mcp_server_uuid: NOTES },
  );
  mapTool("t-purge", NOTES, "INACTIVE", "cleanup");
  mapTool("t-add", NOTES, "ACTIVE", "jot");
}

function mapTool(
  toolUuid: string,
  serverUuid: string,
  status: string,
  overrideName: string | null = null,
) {
  fake.data.namespace_tool_mappings.push({
    namespace_uuid: NS,
    tool_uuid: toolUuid,
    mcp_server_uuid: serverUuid,
    status,
    override_name: overrideName,
    override_title: null,
    override_description: null,
    override_annotations: null,
  });
}

function okHandler() {
  return vi.fn(async (request: any) => ({
    content: [{ type: "text" as const, text: `ran ${request.params.name}` }],
  }));
}

type Handler = ReturnType<typeof okHandler>;

function gate(handler: Handler) {
  return createFilterCallToolMiddleware(noCache)(handler as any);
}

// Same order as metamcp-proxy.ts and the OpenAPI handlers: the filter runs
// before the overrides middleware maps an alias back to its original name.
function pipeline(handler: Handler) {
  const chain = compose(
    createFilterCallToolMiddleware(noCache),
    createToolOverridesCallToolMiddleware(noCache),
  );
  return chain(handler as any);
}

async function callTool(chain: (...args: any[]) => any, name: string) {
  const request = { method: "tools/call", params: { name, arguments: {} } };
  return (await chain(request, context)) as any;
}

beforeEach(() => {
  for (const rows of Object.values(fake.data)) rows.length = 0;
  fake.faults.toolMappingQueries = 0;
});

describe("issue #364: server lookup scoped to the namespace", () => {
  it("call gate blocks an INACTIVE tool when another user has a same-named server", async () => {
    seedSameNameServers();
    mapTool("tool-delete", NS_SERVER, "INACTIVE");
    const handler = okHandler();

    const result = await callTool(gate(handler), "github__delete_repo");

    expect(handler).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
  });

  it("call gate denies a tool whose server is not in the namespace", async () => {
    seedSameNameServers();
    const handler = okHandler();

    const result = await callTool(gate(handler), "unknown__anything");

    expect(handler).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
  });

  it("call gate still allows an ACTIVE tool of a namespace server", async () => {
    seedSameNameServers();
    mapTool("tool-delete", NS_SERVER, "ACTIVE");
    const handler = okHandler();

    await callTool(gate(handler), "github__delete_repo");

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("audit identity resolves the namespace's server, not another user's", async () => {
    seedSameNameServers();

    const identity = await resolveToolIdentity("github__delete_repo", NS);

    expect(identity.mcpServerUuid).toBe(NS_SERVER);
  });

  it("overrides of the namespace's server are applied on list", async () => {
    seedSameNameServers();
    mapTool("tool-delete", NS_SERVER, "ACTIVE", "remove_repo");
    const tool = { name: "github__delete_repo", inputSchema: {} as any };
    const upstream = async () => ({ tools: [tool] });
    const overrides = createToolOverridesListToolsMiddleware(noCache);

    const request = { method: "tools/list" } as any;
    const result = await overrides(upstream as any)(request, context);

    expect(result.tools.map((t) => t.name)).toEqual(["github__remove_repo"]);
  });
});

describe("issue #388: INACTIVE tool called through its override alias", () => {
  it("denies the inactive tool called by its alias", async () => {
    seedNotes();
    const handler = okHandler();

    const result = await callTool(pipeline(handler), "notesvc__cleanup");

    expect(handler).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
  });

  it("denies the inactive tool called by its original name", async () => {
    seedNotes();
    const handler = okHandler();

    await callTool(pipeline(handler), "notesvc__purge_records");

    expect(handler).not.toHaveBeenCalled();
  });

  it("still runs an active tool called by its alias", async () => {
    seedNotes();
    const handler = okHandler();

    await callTool(pipeline(handler), "notesvc__jot");

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].params.name).toBe("notesvc__add_note");
  });
});

describe("override lookup error: the call gate fails closed", () => {
  it("denies an alias call when the gate's override lookup errors and the next lookup works", async () => {
    seedNotes();
    // Only the gate's first query fails; the overrides middleware's lookup a
    // moment later succeeds and would map the alias to the INACTIVE tool.
    fake.faults.toolMappingQueries = 1;
    const handler = okHandler();

    const result = await callTool(pipeline(handler), "notesvc__cleanup");

    expect(handler).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("could not be checked");
  });

  it("denies an active tool too while the lookup errors", async () => {
    seedNotes();
    fake.faults.toolMappingQueries = 1;
    const handler = okHandler();

    const result = await callTool(pipeline(handler), "notesvc__add_note");

    expect(handler).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
  });

  it("still runs an active tool by its alias once the database answers", async () => {
    seedNotes();
    const handler = okHandler();

    await callTool(pipeline(handler), "notesvc__jot");

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
