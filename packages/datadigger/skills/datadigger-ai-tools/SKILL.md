---
name: datadigger-ai-tools
description: >-
  AI-tool surface for the OpenEdge DataDigger VS Code extension (package
  `vscode-openedge-datadigger`, publisher AI4YOU): a database browser/data editor backed by a
  headless Node+OE backend. How an AI agent reaches it without VS Code — via the standalone
  launcher CLI (`datadiggerLauncherCli.ts start`) and the backend HTTP port — plus the command
  and config keys. Use when an agent must browse/query OpenEdge tables.
---

# OpenEdge DataDigger — AI tools

Extension: package `vscode-openedge-datadigger`, publisher `AI4YOU`. Browses OpenEdge databases
and edits data. Backend is **headless** (Node `index.js` + OE socket) — usable without VS Code.

## AI entry points (in priority order)

1. **Headless launcher CLI** (no VS Code) — `native/launcher/datadiggerLauncherCli.ts` →
   `BackendLauncherCore`. Command `start`. Key args:
   - `--backendPath <dir>` (required), `--indexPath <file>` (defaults `<backendPath>/index.js`)
   - `--httpPort <n>` (default **23004**), `--ablSocketPort <n>` (default **23001**)
   - `--dlcPath <dir>`, `--connectionsFilePath <file>`, `--command node`, `--shell true`
   - Emits newline-delimited JSON events on stdout; auto-stops when the parent process exits.
2. **Backend HTTP API** — once started, query `http://localhost:<httpPort>`. Request/response
   shapes are in `datadigger_backend/openApiSpecs/` (`dsDatabasesSpec.yaml`, `dsTablesSpec.yaml`,
   `dsFieldsSpec.yaml`, `dsIndexesSpec.yaml`, …).
3. **VS Code command** — `openedge-datadigger.showDataDigger` (opens the Flutter UI). Requires a
   running extension; human-in-VS-Code only.

## Config keys (VS Code settings)

- `datadigger.httpPort` (default 23004), `datadigger.ablSocketPort` (default 23001)
- `openedge.abl.dbConnections[]` — each `{ "connect": "-db mydb -H localhost -S 12345" }`

## How an agent should drive it

1. Resolve DLC path + a connections file. 2. Spawn launcher CLI `start` with `--backendPath`,
`--dlcPath`, `--connectionsFilePath`. 3. Wait for the "ready" event. 4. Call backend HTTP
endpoints (per `openApiSpecs/`). 5. Kill the CLI process to stop.

## Limitations / readiness

- No MCP server yet (planned). Agent access today is CLI + HTTP.
- Row editing endpoints are less mature than read/query — prefer read-only first.
