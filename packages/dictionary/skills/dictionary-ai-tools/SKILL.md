---
name: dictionary-ai-tools
description: >-
  AI-tool surface for the OpenEdge Data Administration (Dictionary) VS Code extension (package
  `vscode-openedge-data-administration`, publisher AI4YOU): a schema editor + dump/load tooling
  backed by a headless Node+OE backend. How an AI agent reaches it without VS Code via the
  launcher CLI (`dictionaryLauncherCli.ts start`) and the backend HTTP port, plus command IDs and
  config keys. Use when an agent must inspect/administer OpenEdge schema.
---

# OpenEdge Data Administration (Dictionary) — AI tools

Extension: package `vscode-openedge-data-administration`, publisher `AI4YOU`. Schema browser/editor
(databases, tables, fields, indexes, sequences) plus dump/load and reports. Backend is **headless**
(Node `index.js` + OE socket).

## AI entry points (in priority order)

1. **Headless launcher CLI** (no VS Code) — `native/launcher/dictionaryLauncherCli.ts` →
   `backendLauncherCore.ts`. Command `start`. Key args:
   - `--backendPath <dir>` (required), `--indexPath <file>`
   - `--httpPort <n>` (default **23005**), `--ablSocketPort <n>` (default **23002**)
   - `--dlcPath <dir>`, `--connectionsFilePath <file>`, `--command node`, `--shell true`
   - Newline-delimited JSON events on stdout; auto-stops with the parent process.
2. **Backend HTTP API** — `http://localhost:<httpPort>` for schema reads and dump/load.
3. **VS Code commands** (prefix `openedge-data-administration.`) — require a running extension:

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

1. Resolve DLC + connections file. 2. Spawn launcher CLI `start`. 3. Wait for ready event.
4. Call backend HTTP for schema reads / dump-load. 5. Kill the CLI process to stop.

## Limitations / readiness

- No MCP server yet (planned). Agent access today is CLI + HTTP.
- Read/inspect is safest first; treat load/dump and admin (`dbId*`) as destructive — confirm first.
