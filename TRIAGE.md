# Triage of upstream MetaMCP issues

Source: GitHub REST API, metatool-ai/metamcp, read 21 Nov 2026 01:25 SAST. Scope: issues still open when the repository was archived (12 Nov 2026) and opened in the last 12 months (since 21 Nov 2025): 69 of 107 open issues. There are no open pull requests from that period; 40 pull requests from that period were closed without merging (listed at the end).

The upstream repository is archived and read-only. We do not comment there. Each item we take on gets its own issue in this repository, linking the upstream number.

Groups are a first pass from titles and the first lines of each issue. They are not yet verified against the code. Several items may already be fixed by commits that landed after v2.4.22 (noted where we know of one).

Columns: number, title, author, opened, comments, reactions.

## Security (11)

| # | Title | Author | Opened | Comments | Reactions |
|---|---|---|---|---|---|
| #387 | Broken access control in frontend tRPC API: apiKeys.create trusts client user_id (impersonation), tools.getByMcpServerUuid missing authz, logs.get/clear global cross-user store | @HieuPenguinnn | 2026-11-05 | 0 | 0 |
| #375 | Endpoint owners can enumerate MCP servers and reset error state across all tenants via admin routes that fail to scope queries to their namespace. | @LHMisme420 | 2026-10-08 | 2 | 0 |
| #364 | Server lookup by name is not user-scoped in three middleware paths; the namespace tool gate allows on an unresolved server | @Santoshkumarpuppala | 2026-09-07 | 1 | 0 |
| #388 | Inactive namespace tools remain callable through override aliases | @tomatomptt | 2026-11-06 | 0 | 0 |
| #386 | Enable PVR (Private Vulnerability Reports) for better security | @dwelch2344 | 2026-11-03 | 0 | 0 |
| #379 | Security: how can I report a vulnerability privately? | @prajoti-rane | 2026-10-28 | 0 | 0 |
| #376 | Security: no private reporting channel - please enable private vulnerability reporting | @doge-rgb | 2026-10-17 | 0 | 0 |
| #372 | Private channel for a security report? | @kaaan11 | 2026-10-03 | 0 | 0 |
| #370 | Request: enable Private Vulnerability Reporting for metamcp | @GeeksikhSecurity | 2026-09-24 | 0 | 0 |
| #369 | No Security.Md ? | @priyankn | 2026-09-22 | 0 | 0 |
| #291 | Security scan results for metamcp - MCPSafe AIVSS 52/100 (Grade C) | @mcpsafe-gh | 2026-05-12 | 0 | 0 |

## Bugs with a clear repro (or a clear description) (21)

| # | Title | Author | Opened | Comments | Reactions |
|---|---|---|---|---|---|
| #241 | MCP proxy requests hang indefinitely when connecting via stdio transport | @jordyvandomselaar | 2025-12-31 | 1 | 1 |
| #324 | Backend tool-refresh creates a new "background idle session" every cycle, never cleaned up - unbounded session/resource growth on Streamable HTTP backends | @pos-ei-don | 2026-07-06 | 1 | 0 |
| #294 | Stale upstream session IDs after idle expiry - and per-namespace cache multiplies it | @mdbook | 2026-05-15 | 3 | 0 |
| #272 | STDIO servers spawned once per namespace, causing excessive memory usage | @loris-av | 2026-03-16 | 2 | 1 |
| #264 | STDIO servers stuck in ERROR state after restart - error_status persisted in DB | @loris-av | 2026-03-05 | 1 | 0 |
| #265 | OAuth DCR endpoint returns localhost URLs behind reverse proxy (TLS termination) | @loris-av | 2026-03-05 | 1 | 1 |
| #263 | DCR endpoint /oauth/register returns localhost URLs behind reverse proxy | @loris-av | 2026-03-05 | 0 | 0 |
| #277 | /.well-known/oauth-authorization-server served unconditionally, breaks MCP clients using RFC 9728 discovery | @caffeineflo | 2026-03-28 | 0 | 0 |
| #331 | StreamableHTTPServerTransport never sets enableJsonResponse - every /mcp response is SSE-framed, and non-SSE Accept headers get a 406 | @ythefly | 2026-07-22 | 0 | 0 |
| #365 | Proxy fills optional tool parameters with empty defaults, breaking downstream servers with strict validation | @djbobyd | 2026-09-08 | 0 | 0 |
| #333 | Inspector sends invalid default values for optional tool arguments causing -32602 validation errors | @cursor[bot] | 2026-07-24 | 0 | 0 |
| #330 | Cannot add MetaMCP endpoint in Google Antigravity, throws failed to connect (session ID: ): session not found | @adrianharabula | 2026-07-22 | 1 | 0 |
| #321 | Stdio MCP server stderr is always logged as `error`, contrary to MCP spec (stderr carries all log levels) | @bobbyhyam | 2026-06-30 | 0 | 0 |
| #244 | [BUG] Session Cleanup Setting Save | @StreamlinedStartup | 2026-01-05 | 0 | 0 |
| #236 | OIDC/Google SSO Login Fails with PROVIDER_NOT_FOUND Error | @adrianapan | 2025-12-20 | 2 | 0 |
| #254 | [Bug] UI Dialog Box overflow | @rh-id | 2026-02-10 | 0 | 0 |
| #334 | Allow RFC 8252 loopback redirect URIs for native/public OAuth clients | @tossp | 2026-07-24 | 0 | 0 |
| #243 | Error connecting to streamable-http server with "errors" | @Joly0 | 2026-01-05 | 1 | 0 |
| #234 | Notion MCP keeps getting disconnected | @moltar | 2025-12-18 | 1 | 1 |
| #215 | [Bug/Question] Connection Timeout (5 mins) in LAN via Kilo Code - Missing Heartbeat mechanism? | @JianJia2018 | 2025-12-01 | 1 | 0 |
| #224 | The README needs a note next to Middleware that the software doesn't actually provide this now. | @lukolszewski | 2025-12-13 | 0 | 0 |

## Dependencies (1)

| # | Title | Author | Opened | Comments | Reactions |
|---|---|---|---|---|---|
| #378 | Docker image: update Node for CVE-2026-111497 (24.22.1) | @mahfuz-rahman007 | 2026-10-28 | 0 | 0 |

## Features and requests (26)

| # | Title | Author | Opened | Comments | Reactions |
|---|---|---|---|---|---|
| #338 | Please cut a release: the OAuth `refresh_token` grant (f446ce3) has been on main, unreleased, since March | @rafaelborja | 2026-07-30 | 2 | 0 |
| #314 | Emit notifications/tools/list_changed to connected endpoint sessions when a namespace's tool set changes | @pos-ei-don | 2026-06-15 | 0 | 0 |
| #304 | Configurable idle session pool size per (server, namespace) for parallel tool-call throughput | @nate1579 | 2026-05-25 | 0 | 0 |
| #255 | Middleware: Support adding extra instructions/comments to tool description | @ltalirz | 2026-02-12 | 0 | 1 |
| #250 | Add Support for NodeStreamableHTTPServerTransport Session Management from official MCP SDK source | @jetstartai | 2026-02-02 | 0 | 0 |
| #249 | [Discussion] Tool name prefix strategy to avoid 64-character limit in Claude API | @sgaluza | 2026-01-25 | 1 | 0 |
| #247 | [Feature Request] Namespace-based Tool Parameter Overrides (Default Inputs) | @PawsFunctions | 2026-01-19 | 1 | 0 |
| #245 | [Feature Request] Sliding session lifetime (idle timeout instead of absolute timeout) | @sgaluza | 2026-01-13 | 0 | 1 |
| #240 | [FEAT] Forward OAuth token or inject user headers | @diegosc78 | 2025-12-29 | 0 | 2 |
| #237 | Access MCP Endpoint with OAuth | @Meshinfo | 2025-12-21 | 0 | 0 |
| #232 | Feature Request: Add OAuth consent page for MCP client authorization | @that0n3guy | 2025-12-15 | 0 | 1 |
| #230 | An MCP to manage MetaMCP | @danielrosehill | 2025-12-14 | 1 | 2 |
| #229 | feat: Backup utility | @danielrosehill | 2025-12-14 | 0 | 2 |
| #228 | Best way to aggregate groups of tools? | @danielrosehill | 2025-12-14 | 0 | 0 |
| #226 | feat: Cipher Integration & Workflow Proposal | @netztaucher | 2025-12-14 | 0 | 0 |
| #259 | Make backend API separate (accessible via open API) | @mukteshkrmishra | 2026-02-27 | 0 | 0 |
| #271 | Can an API be created based on namespace？ | @bomee | 2026-03-16 | 0 | 0 |
| #340 | feat: portable, versioned JSON export/import for namespaces | @stn1slv | 2026-07-31 | 0 | 0 |
| #367 | Policy enforcement + audit for tools/call - happy to contribute it, or hand over the project | @emektor | 2026-09-13 | 0 | 0 |
| #371 | Optional AgentCert / agent-trust verification as gateway middleware - fit? | @karlmehta | 2026-09-28 | 0 | 0 |
| #359 | Optional Tool Outcome Attestation (TOA) verify gate for MCP CI / promote / register | @AgentStatus-Dev | 2026-08-30 | 0 | 0 |
| #347 | Feature Suggestion: Optional token metering & paid API key support via `neuforge-pay` | @sophieamoure2026-ui | 2026-08-15 | 0 | 0 |
| #346 | Adding OpenCode to Other IDE Documentation | @devkurrt011 | 2026-08-14 | 0 | 0 |
| #327 | Rework MetaMCP namespaces for Zed, development, and Plane | @jzupnick | 2026-07-08 | 0 | 0 |
| #326 | Add Zed remote MCP configuration for coding namespaces | @jzupnick | 2026-07-08 | 0 | 0 |
| #315 | Context Engineering Engine for MCP | @0bon | 2026-06-17 | 0 | 0 |

## Questions (4)

| # | Title | Author | Opened | Comments | Reactions |
|---|---|---|---|---|---|
| #328 | Tool discovery vs. task-specific recommendation - architecture question | @richwilson-bloom | 2026-07-09 | 0 | 0 |
| #292 | [Question] User management in UI | @RobinDvorak | 2026-05-14 | 0 | 1 |
| #266 | [Question] Frontend port 12008 fails to start in offline environment after modifying entrypoint and pnpm version | @tatamuQaQ | 2026-03-05 | 1 | 0 |
| #213 | Accessing MetaMCP from api | @wertpoiu | 2025-11-21 | 1 | 1 |

## Not actionable (spam or empty) (6)

| # | Title | Author | Opened | Comments | Reactions |
|---|---|---|---|---|---|
| #380 | 123 | @tolarigustavo33-create | 2026-11-02 | 0 | 0 |
| #362 | metatool
 | @Pediboi666 | 2026-09-01 | 0 | 0 |
| #285 | selg | @kayannk-hash | 2026-04-30 | 0 | 0 |
| #275 | Trade GCRYPTO | @MRMM180917 | 2026-03-22 | 1 | 0 |
| #274 | meta | @MRMM180917 | 2026-03-20 | 1 | 0 |
| #268 | kimochi-ii.cok | @onsfancom-rgb | 2026-03-07 | 0 | 0 |

## Top 20 to fix first, in order

Order: security first (a gateway holds keys and starts processes), then the release users asked for, then bugs that leak resources or block whole groups of clients, then smaller bugs. Reactions are low across the board (most items have 0 or 1), so impact and clarity of the repro decide the order, not votes.

1. **#387** Broken access control in frontend tRPC API: apiKeys.create trusts client user_id (impersonation), tools.getByMcpServerUuid missing authz, logs.get/clear global cross-user store. Security: tRPC access control (API key impersonation, missing authz, cross-user logs). Commit ec54ade (12 Nov) lists fixes for these exact routes (public API keys no longer impersonate, audit logs scoped, log clearing admin-only). Confirm each route with a test and close.
2. **#375** Endpoint owners can enumerate MCP servers and reset error state across all tenants via admin routes that fail to scope queries to their namespace.. Security: cross-tenant admin routes. ec54ade says /metamcp/:endpoint/admin/* now requires an authenticated endpoint and is scoped to its namespace. Confirm with a test and close.
3. **#364** Server lookup by name is not user-scoped in three middleware paths; the namespace tool gate allows on an unresolved server. Security: server lookup by name not user-scoped in middleware; namespace tool gate allows on unresolved server.
4. **#388** Inactive namespace tools remain callable through override aliases. Security: inactive namespace tools still callable through override aliases.
5. **#386** Enable PVR (Private Vulnerability Reports) for better security. Security process: six issues (#386, #379, #376, #372, #370, #369) ask for a private reporting channel. Our SECURITY.md and GitHub private vulnerability reporting answer all six.
6. **#378** Docker image: update Node for CVE-2026-111497 (24.22.1). Dependency: Node in the Docker image needs the CVE update; pin the base image.
7. **#338** Please cut a release: the OAuth `refresh_token` grant (f446ce3) has been on main, unreleased, since March. Release: users ask for a release with the OAuth refresh_token grant (f446ce3, March 2026). Our first release ships it.
8. **#241** MCP proxy requests hang indefinitely when connecting via stdio transport. Bug: proxy requests hang forever over STDIO.
9. **#324** Backend tool-refresh creates a new "background idle session" every cycle, never cleaned up - unbounded session/resource growth on Streamable HTTP backends. Bug: tool refresh leaks a new idle session every cycle (unbounded growth); clear repro in the issue.
10. **#294** Stale upstream session IDs after idle expiry - and per-namespace cache multiplies it. Bug: stale upstream session IDs after idle expiry, multiplied by the per-namespace cache.
11. **#272** STDIO servers spawned once per namespace, causing excessive memory usage. Bug: STDIO servers spawned once per namespace, high memory use.
12. **#265** OAuth DCR endpoint returns localhost URLs behind reverse proxy (TLS termination). Bug: OAuth DCR returns localhost URLs behind a reverse proxy (also #263). Upstream commit a2e31d8 (12 Nov) says it ported #317 by @oliverhees (getBaseUrl() in DCR). Confirm on a proxy setup and close.
13. **#277** /.well-known/oauth-authorization-server served unconditionally, breaks MCP clients using RFC 9728 discovery. Bug: /.well-known/oauth-authorization-server served unconditionally breaks RFC 9728 discovery clients.
14. **#331** StreamableHTTPServerTransport never sets enableJsonResponse - every /mcp response is SSE-framed, and non-SSE Accept headers get a 406. Bug: enableJsonResponse never set, so every /mcp response is SSE and non-SSE clients get 406.
15. **#365** Proxy fills optional tool parameters with empty defaults, breaking downstream servers with strict validation. Bug: optional tool parameters filled with empty defaults break strict servers (inspector variant #333).
16. **#264** STDIO servers stuck in ERROR state after restart - error_status persisted in DB. Bug: STDIO servers stuck in ERROR after restart. Check whether 225f552 (self-heal on reconnect) already fixes it.
17. **#330** Cannot add MetaMCP endpoint in Google Antigravity, throws failed to connect (session ID: ): session not found. Bug: Google Antigravity cannot connect, session not found.
18. **#236** OIDC/Google SSO Login Fails with PROVIDER_NOT_FOUND Error. Bug: OIDC/Google SSO fails with PROVIDER_NOT_FOUND. Check against 7718bbc (better-auth 1.7).
19. **#321** Stdio MCP server stderr is always logged as `error`, contrary to MCP spec (stderr carries all log levels). Bug: STDIO server stderr always logged as error, against the MCP spec. Small fix.
20. **#244** [BUG] Session Cleanup Setting Save. Bug: session cleanup setting does not save.

Likely already fixed after v2.4.22, to confirm and close on our side: #334 (loopback redirect URIs, commit 91a04a9), #340 (namespace export, commit 7c22565), #224 (README middleware note, docs only).

## Upstream pull requests worth porting

These were closed upstream without being merged. If we port one, the commit keeps a `Co-authored-by` line for the original author and the release notes credit them.

| PR | Title | Author | Opened | Why |
|---|---|---|---|---|
| #336 | fix: reap stdio worker descendants | @ekinnee | 2026-07-27 | Reap STDIO worker descendants. Fits #272 and the process-leak reports. |
| #319 | fix: handle downstream session pool exhaustion | @ZeroPointSix | 2026-06-24 | Handle downstream session pool exhaustion. Fits #294 and #324. |
| #389 | fix(mcp): partition oversized tool lists and preserve metadata | @DYung26 | 2026-11-11 | Partition oversized tool lists and keep metadata. Relates to the 64-character and list-size discussions (#249). |
| #366 | fix(frontend): clear rate limit fields when disabled | @Drm1804 | 2026-09-08 | Clear rate limit fields when disabled. Small frontend fix. |
| #307 | feat(oauth): proxy downstream OAuth fetches through the backend so CORS-less OAuth MCP servers can be added | @msp-vibe-coder | 2026-06-05 | Proxy downstream OAuth fetches through the backend, so OAuth MCP servers without CORS can be added. |
| #374 | Access control, encrypted secrets, activity log, scoped API keys, on-demand MCP servers and security hardening | @Dim145 | 2026-10-08 | Large: access control, encrypted secrets, activity log, scoped API keys, on-demand servers. Too big to port whole; review piece by piece against the 12 Nov security commits. |
| #355 | fix: consolidated perf-live + adversarial audit fixes (Dockerfile build crash, leaks, DB tools path) | @terafin | 2026-08-25 | Large: consolidated fixes for the Dockerfile build, leaks and DB tools path. Review piece by piece. |
| #368 | Create SECURITY.md for security policy | @Gfiberboy2026 | 2026-09-18 | SECURITY.md proposal. We wrote our own; credit the idea. |

Already in the history (merged upstream as commits after the PR was closed), so nothing to port: #383 and #384 by @TheViniAlmeida (0bdd75f, 0dbf342), #280 and #302 by @loris-av (69e4b4f, 2c696db), #335 by @tossp (superseded by 91a04a9), #317 by @oliverhees (ported in a2e31d8).

## All closed, unmerged pull requests since 21 Nov 2025

| PR | Title | Author | Opened | Closed |
|---|---|---|---|---|
| #389 | fix(mcp): partition oversized tool lists and preserve metadata | @DYung26 | 2026-11-11 | 2026-11-11 |
| #384 | fix(docker): make the runner stage install production deps without a TTY | @TheViniAlmeida | 2026-11-03 | 2026-11-03 |
| #383 | fix(docker): locate next proxy-request.js by glob | @TheViniAlmeida | 2026-11-03 | 2026-11-03 |
| #377 | docs: add Parallel Search MCP setup guide | @georgeatparallel | 2026-10-17 | 2026-11-12 |
| #374 | Access control, encrypted secrets, activity log, scoped API keys, on-demand MCP servers and security hardening | @Dim145 | 2026-10-08 | 2026-11-12 |
| #368 | Create SECURITY.md for security policy | @Gfiberboy2026 | 2026-09-18 | 2026-11-12 |
| #366 | fix(frontend): clear rate limit fields when disabled | @Drm1804 | 2026-09-08 | 2026-09-08 |
| #360 | Docs: optional TOA verify before MetaMCP enable | @dulrajnr | 2026-08-31 | 2026-11-12 |
| #356 | test(w2): synthetic conflict with #355 | @terafin | 2026-08-26 | 2026-08-26 |
| #355 | fix: consolidated perf-live + adversarial audit fixes (Dockerfile build crash, leaks, DB tools path) | @terafin | 2026-08-25 | 2026-09-13 |
| #354 | fix(docker): make the Next.js proxy-request sed path-agnostic + fail-open | @terafin | 2026-08-25 | 2026-08-26 |
| #353 | perf(proxy): consolidated prewarm + never-spawn-unused + recovery + leak cleanup (backend-only) | @terafin | 2026-08-25 | 2026-08-26 |
| #352 | perf(proxy): consolidated prewarm + never-spawn-unused + leak cleanup (Sindri x Layer0) | @terafin | 2026-08-25 | 2026-08-25 |
| #351 | perf(proxy): Layer-0 DB tools, prewarm, pool bounds + reproducible Docker build | @terafin | 2026-08-25 | 2026-08-25 |
| #350 | perf(proxy): Layer-0 DB tools, prewarm, pool bounds + reproducible Docker build | @terafin | 2026-08-25 | 2026-08-25 |
| #349 | fix(docker): glob pnpm store dir for proxy-request sed | @terafin | 2026-08-24 | 2026-08-25 |
| #348 | fix(docker): glob pnpm store dir for proxy-request sed | @terafin | 2026-08-24 | 2026-08-24 |
| #336 | fix: reap stdio worker descendants | @ekinnee | 2026-07-27 | 2026-08-25 |
| #335 | fix(oauth): allow native loopback redirect URIs | @tossp | 2026-07-24 | 2026-10-25 |
| #332 | docs: add Security Companion section (mcp-slim-guard) | @lennney | 2026-07-23 | 2026-11-12 |
| #325 | Patch Next.js proxy-request timeout to 600s in Dockerfile | @TanNhatCMS | 2026-07-07 | 2026-08-04 |
| #322 | Fix Docker build on current lockfile and Windows clones | @tfedorko-stc | 2026-07-04 | 2026-07-04 |
| #320 | fix(docker): repair image build on pnpm 10 + current react resolution | @bobbyhyam | 2026-06-28 | 2026-11-12 |
| #319 | fix: handle downstream session pool exhaustion | @ZeroPointSix | 2026-06-24 | 2026-06-24 |
| #317 | fix(oauth): use getBaseUrl() in DCR so endpoints respect APP_URL behind a proxy | @oliverhees | 2026-06-23 | 2026-11-12 |
| #316 | fix(docker): stabilize docker build for version drift and non-interactive installs | @mizuikki | 2026-06-20 | 2026-06-20 |
| #313 | oauth: implement refresh token issuance and rotation | @bobbyhyam | 2026-06-12 | 2026-06-15 |
| #310 | fix(proxy): invalidate-and-retry recovery in the aggregate list handlers | @Exploitacious | 2026-06-11 | 2026-06-14 |
| #307 | feat(oauth): proxy downstream OAuth fetches through the backend so CORS-less OAuth MCP servers can be added | @msp-vibe-coder | 2026-06-05 | 2026-09-01 |
| #306 | Iteration 5 + 6: chc-native sidebar + filesystem-native MCP (SoT, migrate/restore, guard, dashboard) | @Kirchlive | 2026-05-29 | 2026-05-29 |
| #305 | Iteration 5 + 6: chc-native sidebar + filesystem-native MCP (SoT, migrate/restore, guard, dashboard) | @Kirchlive | 2026-05-29 | 2026-05-29 |
| #302 | feat: expose namespace description as MCP instructions | @loris-av | 2026-05-21 | 2026-06-15 |
| #290 | Enable remote MCP OAuth sessions to survive Košík authorization | @nikopol666 | 2026-05-12 | 2026-05-12 |
| #287 | feat(codec): opt-in binary transport for /:uuid/mcp | @wdunn001 | 2026-05-08 | 2026-05-08 |
| #280 | feat: make maxTotalConnections configurable via env var | @loris-av | 2026-04-09 | 2026-06-14 |
| #278 | docs: add Fronteir AI hosted deployment option | @ElishaKay | 2026-03-29 | 2026-05-24 |
| #269 | Add NUBIX platform architecture diagram (Draw.io) | @Bargemanos | 2026-03-08 | 2026-03-08 |
| #267 | feat: provision STDIO MCP servers as Kubernetes Pods via supergateway | @suwanjang-dalpha | 2026-03-05 | 2026-03-05 |
| #262 | feat: add admin role with RBAC and fix bootstrap signup block | @suwanjang-dalpha | 2026-03-05 | 2026-03-05 |
| #261 | docs: add Korean (ko) translation | @suwanjang-dalpha | 2026-03-04 | 2026-03-09 |
