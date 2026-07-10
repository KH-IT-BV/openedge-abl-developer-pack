---
name: database-selector-ai-tools
description: >-
  AI-tool surface for the Database Selector shared Dart library (`vscode-database-selector`,
  KH-IT-BV): the OpenEdge DB connection selection/management used by datadigger, dictionary, and
  hck. The shared connection contract (`openedge.abl.dbConnections`) an agent provides to the
  other plugins' tools, and why this is a foundation library, not a standalone AI tool. Use when
  an agent needs to supply/validate OpenEdge DB connections.
---

# Database Selector — AI tools

`vscode-database-selector` (KH-IT-BV) is a **shared Dart library** (`lib/src/models`,
`lib/src/services`, `lib/src/theme`), not a standalone extension. It provides OpenEdge database
connection selection/management reused by the DataDigger, Dictionary, and HCK plugins.

## AI entry points

- **Indirect** — an agent does not call this library directly. It surfaces through the consuming
  plugins' AI tools (`datadigger-ai-tools`, `dictionary-ai-tools`, `hck-ai-tools`).
- The thing an agent actually supplies is the **connection contract** those plugins consume.

## Shared connection contract

Consumed by the OpenEdge plugins as `openedge.abl.dbConnections[]` (VS Code settings) and, for
headless launcher CLIs, via `--connectionsFilePath`:

```json
{ "openedge.abl": { "dbConnections": [ { "connect": "-db mydb -H localhost -S 12345" } ] } }
```

Each `connect` is a Progress connection parameter string (`-db <name> -H <host> -S <service>` …).

## How an agent should drive it

1. Assemble valid `connect` strings (one per database).
2. Write them to a connections file and pass `--connectionsFilePath` to a plugin launcher CLI,
   or set `openedge.abl.dbConnections` in workspace settings for the VS Code flow.
3. The selector logic (active DB, validation) is handled inside the consuming plugin.

## Limitations / readiness

- Not a standalone MCP/CLI target. Open decision: whether a shared
  `list_connections`/`validate_connection` MCP is worth building, or whether connection selection
  stays an input to the other plugins' tools.
