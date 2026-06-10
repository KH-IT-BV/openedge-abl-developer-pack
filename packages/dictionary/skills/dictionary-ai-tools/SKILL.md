---
name: dictionary-ai-tools
description: >-
  AI-tool surface for the OpenEdge Data Administration (Dictionary) VS Code extension (package
  `vscode-openedge-data-administration`, publisher AI4YOU): a schema editor + dump/load tooling
  backed by a headless Node+OE backend. Primary agent access is the `openedge-dictionary` MCP
  server (~50 tools: schema reads, reports, dump/load, confirmed schema edits, DB lifecycle/ops,
  environment/process inspection); fallbacks are the launcher CLI (`dictionaryLauncherCli.ts
  start`) and the backend HTTP port. Use when an agent must inspect/administer OpenEdge schema.
---

# OpenEdge Data Administration (Dictionary) — AI tools

Extension: package `vscode-openedge-data-administration`, publisher `AI4YOU`. Schema browser/editor
(databases, tables, fields, indexes, sequences) plus dump/load and reports. Backend is **headless**
(Node `index.js` + OE socket).

## AI entry points (in priority order)

1. **MCP server** — server key **`openedge-dictionary`** (also exposed as `languageModelTools`
   in chat via `#<reference>`, e.g. `#listTables`). ~50 tools in groups:
   - **Read-only**: `health_check`, `test_connection`, `list_databases/tables/fields/indexes/sequences/areas`,
     `get_db_properties`, `get_table_properties`, `get_index_properties`, `get_db_identification`,
     `check_trigger_syntax`, `scan_inc_df_mismatches`.
   - **Reports**: `report_table/field/index/sequence/view/trigger/user`.
   - **Dump** (writes files): `dump_df`, `dump_incremental_df`, `dump_data`, `dump_sequence_values`.
   - **Schema edits** (confirmation object: `confirmed: true` + exact `confirmationText` + `reason`):
     `create_*`/`update_*` (`APPLY TO <database>`), `delete_*` (`DELETE FROM <database>`).
   - **Load** (destructive): `load_df`, `load_data` (`LOAD INTO <database>`).
   - **DB lifecycle/ops** (by `dbPath`): `database_status`, `start_database`,
     `start_database_proserve`, `stop_database`, `backup_database`, `restore_database`,
     `validate_database`, `adminserver_start/stop/status`.
   - **Environment/process**: `openedge_environment_info`, `system_resources`,
     `progress_processes`, `kill_progress_process`.
2. **Headless launcher CLI** (no VS Code) — `native/launcher/dictionaryLauncherCli.ts` →
   `backendLauncherCore.ts`. Command `start`. Key args:
   - `--backendPath <dir>` (required), `--indexPath <file>`
   - `--httpPort <n>` (default **23005**), `--ablSocketPort <n>` (default **23002**)
   - `--dlcPath <dir>`, `--connectionsFilePath <file>`, `--command node`, `--shell true`
   - Newline-delimited JSON events on stdout; auto-stops with the parent process.
3. **Backend HTTP API** — `http://localhost:<httpPort>` for schema reads and dump/load.
4. **VS Code commands** (prefix `openedge-data-administration.`) — require a running extension:

| Area | Commands |
|---|---|
| Browse | `showDictionary`, `showDatabases`, `showTables`, `showFields`, `showIndexes`, `showSequences`, `refresh` |
| Dump | `dumpDefinitions`, `dumpIncrementalDefinitions`, `dumpData`, `dumpSequenceValues` |
| Load | `loadDefinitions`, `loadData`, `loadSequenceValues` |
| Admin | `databaseProperties`, `dbIdMaintenance`, `dbIdHistory` |
| Reports | `reportQuickTable`, `reportQuickField`, `reportQuickIndex`, `reportSequence`, `reportView`, `reportTrigger`, `reportUser` |

## Config keys (VS Code settings)

- `dictionary.httpPort` (default 23005), `dictionary.ablSocketPort` (default 23002)
- `openedge.abl.dbConnections[]` — each `{ "connect": "-db mydb -H localhost -S 12345" }`

## How an agent should drive it

- Preferred: use the **`openedge-dictionary` MCP tools** (or `#<reference>` in chat). Inspect
  first (`list_*`, `get_*`, reports); every schema edit/load/lifecycle write requires the exact
  confirmation text (`APPLY TO …` / `DELETE FROM …` / `LOAD INTO …`) plus a reason.
- Fallback (no MCP host): 1. Resolve DLC + connections file. 2. Spawn launcher CLI `start`.
  3. Wait for ready event. 4. Call backend HTTP for schema reads / dump-load. 5. Kill the CLI
  process to stop.

## Limitations / readiness

- Schema edits, loads, stop/restore/kill are destructive and confirmation-gated — never run them
  against production databases without an explicitly approved target.
- Databases come from the shared `openedge.abl.dbConnections` config (OpenEdge Config
  Management extension); lifecycle/ops tools take a `dbPath` instead.
