import { TRPCError } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Regression tests for upstream metatool-ai/metamcp issue #387 (frontend
// tRPC access control), one block per finding:
//   1. apiKeys.create must not take the key owner from the client
//   2. tools.getByMcpServerUuid must check access to the server
//   3. logs.getLogs / logs.clearLogs must not be open to every user
//
// Level: unit tests of the tRPC implementation functions with the
// repositories mocked, the same level as security-access.test.ts. They do
// not prove the tRPC router wiring or the gateway key check.

const logStore = vi.hoisted(() => ({
  getLogs: vi.fn(() => [{ serverName: "srv", message: "stderr line" }]),
  getLogCount: vi.fn(() => 1),
  clearLogs: vi.fn(),
}));

vi.mock("../lib/metamcp/log-store", () => ({ metamcpLogStore: logStore }));

const mocks = vi.hoisted(() => ({
  findUserEmailById: vi.fn(),
  server: {
    findByUuid: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteByUuid: vi.fn(),
    bulkCreate: vi.fn(),
    findAllAccessibleToUser: vi.fn(),
  },
  namespace: {
    findByUuid: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteByUuid: vi.fn(),
    findByUuidWithServers: vi.fn(),
  },
  endpoint: {
    findByName: vi.fn(),
    findByUuidWithNamespace: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteByUuid: vi.fn(),
  },
  apiKey: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findAccessibleToUser: vi.fn(),
    findByUserId: vi.fn(),
  },
  oauthSession: {
    findByMcpServerUuid: vi.fn(),
    upsert: vi.fn(),
  },
  tools: {
    findByMcpServerUuid: vi.fn(),
    bulkUpsert: vi.fn(),
    syncTools: vi.fn(),
  },
}));

vi.mock("../lib/user-lookup", () => ({
  findUserEmailById: mocks.findUserEmailById,
}));

vi.mock("../db/repositories", () => ({
  mcpServersRepository: mocks.server,
  namespacesRepository: mocks.namespace,
  endpointsRepository: mocks.endpoint,
  oauthSessionsRepository: mocks.oauthSession,
  toolsRepository: mocks.tools,
  namespaceMappingsRepository: {
    findNamespacesByServerUuid: vi.fn(async () => []),
  },
  ApiKeysRepository: class {
    create = mocks.apiKey.create;
    update = mocks.apiKey.update;
    delete = mocks.apiKey.delete;
    findAccessibleToUser = mocks.apiKey.findAccessibleToUser;
    findByUserId = mocks.apiKey.findByUserId;
  },
}));

vi.mock("../lib/metamcp/mcp-server-pool", () => ({
  mcpServerPool: {
    ensureIdleSessionForNewServer: vi.fn(async () => undefined),
    invalidateIdleSession: vi.fn(async () => undefined),
    cleanupIdleSession: vi.fn(async () => undefined),
  },
}));
vi.mock("../lib/metamcp/metamcp-server-pool", () => ({
  metaMcpServerPool: {
    ensureIdleServerForNewNamespace: vi.fn(async () => undefined),
    invalidateIdleServer: vi.fn(async () => undefined),
    invalidateIdleServers: vi.fn(async () => undefined),
    invalidateOpenApiSessions: vi.fn(async () => undefined),
  },
}));
vi.mock("../lib/metamcp/metamcp-middleware/tool-overrides.functional", () => ({
  clearOverrideCache: vi.fn(),
  mapOverrideNameToOriginal: vi.fn(async (name: string) => name),
}));
vi.mock("../lib/metamcp/server-error-tracker", () => ({
  serverErrorTracker: { resetServerErrorState: vi.fn(async () => undefined) },
}));
vi.mock("../lib/metamcp/utils", () => ({
  convertDbServerToParams: vi.fn(async () => null),
}));
vi.mock("@/utils/logger", () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { apiKeysImplementations } from "./api-keys.impl";
import { logsImplementations } from "./logs.impl";
import { toolsImplementations } from "./tools.impl";

const OWNER = "user-owner";
const OTHER = "user-other";
const ADMIN = "user-admin";
const SERVER_UUID = "00000000-0000-0000-0000-000000000001";

const EMAILS: Record<string, string> = {
  [OWNER]: "owner@example.com",
  [OTHER]: "other@example.com",
  [ADMIN]: "admin@example.com",
};

const ORIGINAL_ADMIN_EMAILS = process.env.METAMCP_ADMIN_EMAILS;

function enableMultiTenant() {
  process.env.METAMCP_ADMIN_EMAILS = "admin@example.com";
}

function privateServer(userId: string | null) {
  return { uuid: SERVER_UUID, name: "srv", user_id: userId };
}

function toolRow() {
  return {
    uuid: "tool-1",
    name: "t",
    description: null,
    toolSchema: { type: "object" },
    created_at: new Date(),
    updated_at: new Date(),
    mcp_server_uuid: SERVER_UUID,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.METAMCP_ADMIN_EMAILS;
  mocks.findUserEmailById.mockImplementation(
    async (id: string) => EMAILS[id] ?? null,
  );
});

afterEach(() => {
  if (ORIGINAL_ADMIN_EMAILS === undefined) {
    delete process.env.METAMCP_ADMIN_EMAILS;
  } else {
    process.env.METAMCP_ADMIN_EMAILS = ORIGINAL_ADMIN_EMAILS;
  }
});

describe("issue #387 finding 1: apiKeys.create owner", () => {
  it("rejects a key requested for another user's id", async () => {
    await expect(
      apiKeysImplementations.create({ name: "k", user_id: OTHER }, OWNER),
    ).rejects.toBeInstanceOf(TRPCError);
    expect(mocks.apiKey.create).not.toHaveBeenCalled();
  });

  it("stores the caller as owner when no user_id is sent", async () => {
    mocks.apiKey.create.mockResolvedValue({
      uuid: "k",
      name: "k",
      key: "sk",
      user_id: OWNER,
      created_at: new Date(),
    });
    await apiKeysImplementations.create({ name: "k" }, OWNER);
    expect(mocks.apiKey.create).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: OWNER }),
    );
  });
});

describe("issue #387 finding 2: tools.getByMcpServerUuid access", () => {
  it("does not return tools of another user's private server", async () => {
    mocks.server.findByUuid.mockResolvedValue(privateServer(OWNER));
    mocks.tools.findByMcpServerUuid.mockResolvedValue([toolRow()]);

    const result = await toolsImplementations.getByMcpServerUuid(
      { mcpServerUuid: SERVER_UUID },
      OTHER,
    );

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(mocks.tools.findByMcpServerUuid).not.toHaveBeenCalled();
  });

  it("returns the tools to the server's owner", async () => {
    mocks.server.findByUuid.mockResolvedValue(privateServer(OWNER));
    mocks.tools.findByMcpServerUuid.mockResolvedValue([toolRow()]);

    const result = await toolsImplementations.getByMcpServerUuid(
      { mcpServerUuid: SERVER_UUID },
      OWNER,
    );

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });
});

describe("issue #387 finding 3: logs are admin-only in multi-tenant mode", () => {
  it("a non-admin cannot read the global logs", async () => {
    enableMultiTenant();
    const read = logsImplementations.getLogs({ limit: 10 } as any, OTHER);
    await expect(read).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(logStore.getLogs).not.toHaveBeenCalled();
  });

  it("a non-admin cannot clear the logs", async () => {
    enableMultiTenant();
    const clear = logsImplementations.clearLogs(OTHER);
    await expect(clear).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(logStore.clearLogs).not.toHaveBeenCalled();
  });

  it("an admin can read and clear the logs", async () => {
    enableMultiTenant();
    const input = { limit: 10 } as any;
    const result = await logsImplementations.getLogs(input, ADMIN);
    await logsImplementations.clearLogs(ADMIN);

    expect(result.success).toBe(true);
    expect(logStore.clearLogs).toHaveBeenCalledTimes(1);
  });
});
