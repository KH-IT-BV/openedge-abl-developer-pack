---
name: hck-ai-tools
description: >-
  AI-tool surface for the OpenEdge HCK - Health Check Kit VS Code extension (package
  `vscode-openedge-hck`, publisher AI4YOU): a database health/diagnostics dashboard backed by a
  headless Node+OE backend with rich OpenAPI specs. How an AI agent reaches it without VS Code via
  the launcher CLI (`hckLauncherCli.ts start`) and the backend HTTP port. Use when an agent must
  run OpenEdge health checks or read diagnostics (buffers, locks, PWs, …).
---

# OpenEdge HCK (Health Check Kit) — AI tools

Extension: package `vscode-openedge-hck`, publisher `AI4YOU`. Monitoring/analysis dashboard for
OpenEdge databases. Backend is **headless** (Node `index.js` + OE socket) with the most detailed
OpenAPI specs of the family.

## AI entry points (in priority order)

1. **Headless launcher CLI** (no VS Code) — `native/launcher/hckLauncherCli.ts`. Command `start`:
   - `--backendPath <dir>` (required), `--indexPath <file>`
   - `--httpPort <n>` (default **23003**), `--ablSocketPort <n>` (default **23000**)
   - `--dlcPath <dir>`, `--connectionsFilePath <file>`, `--command node`, `--shell true`
   - Newline-delimited JSON events on stdout; auto-stops with the parent process.
2. **Backend HTTP API** — `http://localhost:<httpPort>`. Endpoints described by the specs in
   `hck_backend/openApiSpecs/` (e.g. `dsActBufferSpec.yaml`, `dsActLockSpec.yaml`,
   `dsActPWsSpec.yaml`, …) — one diagnostic area per spec. Richest read surface for an agent.
3. **VS Code command** — `openedge-hck.showHCK` (opens the Flutter dashboard). Human-in-VS-Code only.

## Config keys (VS Code settings)

- `hck.httpPort` (default 23003), `hck.ablSocketPort` (default 23000)
- `openedge.abl.dbConnections[]` — each `{ "connect": "-db mydb -H localhost -S 12345" }`

## How an agent should drive it

1. Resolve DLC + connections file. 2. Spawn `hckLauncherCli.ts start`. 3. Wait for ready event.
4. GET the diagnostic endpoints (map each `ds*Spec.yaml` to its area). 5. Kill the CLI to stop.

## Limitations / readiness

- No MCP server yet (planned). Agent access today is CLI + HTTP.
- Diagnostics are read-only/observational — ideal for safe agent orchestration.
