---
name: hck-ai-tools
description: >-
  AI-tool surface for the OpenEdge HCK - Health Check Kit VS Code extension (package
  `vscode-openedge-hck`, publisher AI4YOU): a database health/diagnostics dashboard backed by a
  headless Node+OE backend with rich OpenAPI specs. Primary agent access is the `openedge-hck`
  MCP server (18 read-only diagnostic tools + 2 confirmed actions); fallbacks are the launcher
  CLI (`hckLauncherCli.ts start`) and the backend HTTP port. Use when an agent must run OpenEdge
  health checks or read diagnostics (buffers, locks, PWs, …).
---

# OpenEdge HCK (Health Check Kit) — AI tools

Extension: package `vscode-openedge-hck`, publisher `AI4YOU`. Monitoring/analysis dashboard for
OpenEdge databases. Backend is **headless** (Node `index.js` + OE socket) with the most detailed
OpenAPI specs of the family.

## AI entry points (in priority order)

1. **MCP server** — server key **`openedge-hck`** (also exposed as `languageModelTools` in chat
   via `#<reference>`, e.g. `#getActivitySummary`). All tools take `db` (logical name from
   `openedge-project.json`) and optional `conn` (full connection string, incl. credentials when
   running outside VS Code).
   - Read-only (18): `get_connections`, `get_file_list`, `get_activity_summary`,
     `get_buffer_activity`, `get_lock_activity`, `get_pw_activity`, `get_server_activity`,
     `get_user_io`, `get_area_status`, `get_buffer_status`, `get_checkpoints`, `get_locks`,
     `get_record_info`, `get_transactions`, `get_table_stats`, `get_user_table_stats`,
     `get_replication_agent_status`, `get_replication_server_status`.
   - Actions (require `confirm: true` + `reason`): `disconnect_user`, `clear_lock`.
2. **Headless launcher CLI** (no VS Code) — `native/launcher/hckLauncherCli.ts`. Command `start`:
   - `--backendPath <dir>` (required), `--indexPath <file>`
   - `--httpPort <n>` (default **23003**), `--ablSocketPort <n>` (default **23000**)
   - `--dlcPath <dir>`, `--connectionsFilePath <file>`, `--command node`, `--shell true`
   - Newline-delimited JSON events on stdout; auto-stops with the parent process.
3. **Backend HTTP API** — `http://localhost:<httpPort>`. Endpoints described by the specs in
   `hck_backend/openApiSpecs/` (e.g. `dsActBufferSpec.yaml`, `dsActLockSpec.yaml`,
   `dsActPWsSpec.yaml`, …) — one diagnostic area per spec. Richest read surface for an agent.
4. **VS Code command** — `openedge-hck.showHCK` (opens the Flutter dashboard). Human-in-VS-Code only.

## Config keys (VS Code settings)

- `hck.httpPort` (default 23003), `hck.ablSocketPort` (default 23000)
- `openedge.abl.dbConnections[]` — each `{ "connect": "-db mydb -H localhost -S 12345" }`

## How an agent should drive it

- Preferred: use the **`openedge-hck` MCP tools** (or `#<reference>` in chat). For actions, find
  targets first (`get_connections` / `get_locks`), pass `confirm: true` + `reason`, then verify
  with the same read tool afterwards.
- Fallback (no MCP host): 1. Resolve DLC + connections file. 2. Spawn `hckLauncherCli.ts start`.
  3. Wait for ready event. 4. GET the diagnostic endpoints (map each `ds*Spec.yaml` to its area).
  5. Kill the CLI to stop.

## Limitations / readiness

- Diagnostics are read-only/observational — ideal for safe agent orchestration. Only
  `disconnect_user` and `clear_lock` mutate state, and both are confirmation-gated.
- The MCP server cannot read VS Code SecretStorage — pass credentials via `conn` when headless.
