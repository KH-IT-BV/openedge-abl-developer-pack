---
name: datadigger-ai-tools
description: >-
  AI-tool surface for the OpenEdge DataDigger VS Code extension (package
  `vscode-openedge-datadigger`, publisher AI4YOU): a database browser/data editor backed by a
  headless Node+OE backend. Primary agent access is the `openedge-datadigger` MCP server (10
  tools: list/describe/query/count + confirmed row writes); fallbacks are the standalone
  launcher CLI (`datadiggerLauncherCli.ts start`) and the backend HTTP port. Use when an agent
  must browse/query OpenEdge tables.
---

# OpenEdge DataDigger — AI tools

Extension: package `vscode-openedge-datadigger`, publisher `AI4YOU`. Browses OpenEdge databases
and edits data. Backend is **headless** (Node `index.js` + OE socket) — usable without VS Code.

## AI entry points (in priority order)

1. **MCP server** — server key **`openedge-datadigger`** (also exposed as `languageModelTools`
   in chat via `#<reference>`, e.g. `#queryTable`). Tools:
   - Read-only: `list_databases`, `list_tables`, `describe_table`, `list_indexes`,
     `query_table` (filter/pagination/sort), `count_table`.
   - Writes (each requires `confirm: true` + non-empty `reason`): `insert_row`, `update_row`,
     `delete_row`, `export_query` (XML/JSON/CSV/TXT/4GL/Progress).
   - `filter`/`where` args are an ABL WHERE clause **without** the `WHERE` keyword.
2. **Headless launcher CLI** (no VS Code) — `native/launcher/datadiggerLauncherCli.ts` →
   `BackendLauncherCore`. Command `start`. Key args:
   - `--backendPath <dir>` (required), `--indexPath <file>` (defaults `<backendPath>/index.js`)
   - `--httpPort <n>` (default **23004**), `--ablSocketPort <n>` (default **23001**)
   - `--dlcPath <dir>`, `--connectionsFilePath <file>`, `--command node`, `--shell true`
   - Emits newline-delimited JSON events on stdout; auto-stops when the parent process exits.
3. **Backend HTTP API** — once started, query `http://localhost:<httpPort>`. Request/response
   shapes are in `datadigger_backend/openApiSpecs/` (`dsDatabasesSpec.yaml`, `dsTablesSpec.yaml`,
   `dsFieldsSpec.yaml`, `dsIndexesSpec.yaml`, …).
4. **VS Code command** — `openedge-datadigger.showDataDigger` (opens the Flutter UI). Requires a
   running extension; human-in-VS-Code only.

## Config keys (VS Code settings)

- `datadigger.httpPort` (default 23004), `datadigger.ablSocketPort` (default 23001)
- `openedge.abl.dbConnections[]` — each `{ "connect": "-db mydb -H localhost -S 12345" }`

## How an agent should drive it

- Preferred: use the **`openedge-datadigger` MCP tools** (or `#<reference>` in chat).
  Inspect schema first (`list_tables`, `describe_table`), then `query_table`; gate every write
  with `confirm: true` + `reason`.
- Fallback (no MCP host): 1. Resolve DLC path + a connections file. 2. Spawn launcher CLI
  `start` with `--backendPath`, `--dlcPath`, `--connectionsFilePath`. 3. Wait for the "ready"
  event. 4. Call backend HTTP endpoints (per `openApiSpecs/`). 5. Kill the CLI process to stop.

## Limitations / readiness

- Row writes are confirmation-gated; writes can additionally be disabled server-side
  (`DATADIGGER_MCP_WRITES_ENABLED`). Prefer read-only first.
- Databases come from the shared `openedge.abl.dbConnections` config (OpenEdge Config
  Management extension).
