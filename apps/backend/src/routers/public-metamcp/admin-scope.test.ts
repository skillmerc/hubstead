import type { AddressInfo } from "node:net";

import express from "express";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// Regression tests for upstream metatool-ai/metamcp issue #375: the
// per-endpoint admin routes (/:endpoint_name/admin/error-status and
// /:endpoint_name/admin/reset-errors) must only see and reset the MCP
// servers of the endpoint's own namespace, never every tenant's servers.
//
// Level: the real express admin router over HTTP on a loopback port, with
// the endpoint lookup, API key check and repositories mocked. It does not
// prove the real API key or OAuth checks, which are mocked here.

const mocks = vi.hoisted(() => ({
  findAll: vi.fn(),
  findByUuid: vi.fn(),
  findByUuidWithServers: vi.fn(),
  resetServerErrorState: vi.fn(),
}));

vi.mock("@/utils/logger", () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// The test endpoint "tenant-a" maps to namespace "ns-a". The header
// x-test-auth=off simulates an endpoint without API key or OAuth.
vi.mock("@/middleware/lookup-endpoint-middleware", () => ({
  lookupEndpoint: (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => {
    const auth = req.headers["x-test-auth"] !== "off";
    (req as any).namespaceUuid = "ns-a";
    (req as any).endpoint = {
      name: req.params.endpoint_name,
      enable_api_key_auth: auth,
      enable_oauth: false,
    };
    next();
  },
}));

vi.mock("@/middleware/api-key-oauth.middleware", () => ({
  authenticateApiKey: (
    _req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => next(),
}));

vi.mock("../../db/repositories", () => ({
  mcpServersRepository: {
    findAll: mocks.findAll,
    findByUuid: mocks.findByUuid,
  },
  namespacesRepository: {
    findByUuidWithServers: mocks.findByUuidWithServers,
  },
}));

vi.mock("../../lib/metamcp/mcp-server-pool", () => ({
  mcpServerPool: { invalidateIdleSession: vi.fn(async () => undefined) },
}));

vi.mock("../../lib/metamcp/server-error-tracker", () => ({
  serverErrorTracker: {
    resetServerErrorState: mocks.resetServerErrorState,
    getServerAttempts: vi.fn(() => 0),
  },
}));

vi.mock("../../lib/metamcp/utils", () => ({
  convertDbServerToParams: vi.fn(async () => null),
}));

import adminRouter from "./admin";

const OWN = { uuid: "srv-own", name: "own", error_status: "ERROR" };
const OWN_OK = { uuid: "srv-own-ok", name: "own-ok", error_status: "NONE" };
const FOREIGN = { uuid: "srv-foreign", name: "foreign", error_status: "ERROR" };

let baseUrl = "";
let close: () => void = () => undefined;

beforeAll(async () => {
  const app = express();
  app.use(adminRouter);
  const listener = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => listener.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(listener.address() as AddressInfo).port}`;
  close = () => listener.close();
});

afterAll(() => close());

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findAll.mockResolvedValue([OWN, OWN_OK, FOREIGN]);
  mocks.findByUuid.mockResolvedValue(null);
  mocks.findByUuidWithServers.mockImplementation(async (uuid: string) => {
    return uuid === "ns-a" ? { uuid, servers: [OWN, OWN_OK] } : null;
  });
  mocks.resetServerErrorState.mockResolvedValue(undefined);
});

function post(path: string, body: unknown, headers = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("issue #375: admin routes scoped to the endpoint's namespace", () => {
  it("error-status lists only the namespace's servers", async () => {
    const res = await fetch(`${baseUrl}/tenant-a/admin/error-status`);
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    const uuids = body.servers.map((s: { uuid: string }) => s.uuid);
    expect(uuids).toEqual(["srv-own", "srv-own-ok"]);
    expect(mocks.findAll).not.toHaveBeenCalled();
  });

  it("reset-errors without a uuid resets only the namespace's errored servers", async () => {
    const res = await post("/tenant-a/admin/reset-errors", {});

    expect(res.status).toBe(200);
    const reset = mocks.resetServerErrorState.mock.calls.map((c) => c[0]);
    expect(reset).toEqual(["srv-own"]);
    expect(mocks.findAll).not.toHaveBeenCalled();
  });

  it("reset-errors refuses a server uuid from another namespace", async () => {
    const res = await post("/tenant-a/admin/reset-errors", {
      serverUuid: "srv-foreign",
    });

    expect(res.status).toBe(404);
    expect(mocks.resetServerErrorState).not.toHaveBeenCalled();
  });

  it("admin routes are refused on an endpoint without authentication", async () => {
    const off = { "x-test-auth": "off" };
    const status = await fetch(`${baseUrl}/tenant-a/admin/error-status`, {
      headers: off,
    });
    const reset = await post("/tenant-a/admin/reset-errors", {}, off);

    expect(status.status).toBe(403);
    expect(reset.status).toBe(403);
    expect(mocks.resetServerErrorState).not.toHaveBeenCalled();
  });
});
