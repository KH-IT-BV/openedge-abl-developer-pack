# OpenEdge HCK — Agent Tools

**Extension:** [`AI4YOU.vscode-openedge-hck`](https://marketplace.visualstudio.com/items?itemName=AI4YOU.vscode-openedge-hck)
**MCP server key:** `openedge-hck`

HCK (Health Check Kit) exposes OpenEdge database diagnostics to AI agents so they
can inspect live activity, status, statistics, and replication, and—after a
confirmation gate—act on findings. In chat, reference a tool with
`#<reference>` (e.g. `#getActivitySummary`).

## Read-only tools

These never modify data and require no confirmation. All take `db` (required)
and an optional `conn` connection string.

| Tool                                  | Reference                     | Description                                                       | Required args               | Optional args | Status            |
| ------------------------------------- | ----------------------------- | ----------------------------------------------------------------- | --------------------------- | ------------- | ------------------ |
| Get Database Connections              | `#getConnections`             | Lists active database connections and their connection IDs.       | `db`                        | `conn`        | 🚧 In progress |
| Get Database File List                | `#getFileList`                | Lists database files and their storage areas.                     | `db`                        | `conn`        | 🟡 Validation 1/2         |
| Get Activity Summary                  | `#getActivitySummary`         | High-level activity counters: reads, writes, locks, commits, I/O. | `db`                        | `conn`        | 🟡 Validation 1/2         |
| Get Buffer Activity                   | `#getBufferActivity`          | Per-buffer-pool reads, writes, hits, and waits.                   | `db`                        | `conn`        | 🚧 In progress |
| Get Lock Activity                     | `#getLockActivity`            | Lock requests, grants, waits, and timeouts.                       | `db`                        | `conn`        | 🟡 Validation 1/2         |
| Get Page Writer Activity              | `#getPwActivity`              | Page Writer pages written, scan cycles, flushing metrics.         | `db`                        | `conn`        | 🟡 Validation 1/2         |
| Get Server Activity                   | `#getServerActivity`          | Per-server messages, bytes, and queue lengths.                    | `db`                        | `conn`        | 🟡 Validation 1/2         |
| Get User I/O                          | `#getUserIo`                  | Per-user reads, writes, and record-access counts.                 | `db`                        | `conn`        | 🟡 Validation 1/2         |
| Get Storage Area Status               | `#getAreaStatus`              | Size, free space, and high-water marks per storage area.          | `db`                        | `conn`        | 🚧 In progress |
| Get Buffer Status                     | `#getBufferStatus`            | Buffer pool size, used count, and efficiency metrics.             | `db`                        | `conn`        | 🟡 Validation 1/2         |
| Get Checkpoint Info                   | `#getCheckpoints`             | Checkpoint history: last time, interval, duration.                | `db`                        | `conn`        | 🟡 Validation 1/2         |
| Get Active Locks                      | `#getLocks`                   | Currently held locks: table, user, type, connection ID.           | `db`                        | `conn`        | 🟡 Validation 1/2         |
| Get Record Field Details              | `#getRecordInfo`              | Field-level detail for one record.                                | `db`, `fileNumber`, `recid` | `conn`        | 🟡 Validation 1/2         |
| Get Active Transactions               | `#getTransactions`            | Active transactions: ID, start time, user, state.                 | `db`                        | `conn`        | 🟡 Validation 1/2         |
| Get Table & Index Statistics          | `#getTableStats`              | Cumulative table/index reads, creates, updates, deletes.          | `db`                        | `conn`        | 🟡 Validation 1/2         |
| Get Per-User Table & Index Statistics | `#getUserTableStats`          | Table/index stats broken down per user.                           | `db`                        | `conn`        | 🟡 Validation 1/2         |
| Get Replication Agent Status          | `#getReplicationAgentStatus`  | Replication agent state, queue depth, lag.                        | `db`                        | `conn`        | 🚧 In progress |
| Get Replication Server Status         | `#getReplicationServerStatus` | Replication server state, connected agents, lag.                  | `db`                        | `conn`        | 🚧 In progress |

## Action tools (require confirmation)

These mutate server state. Each **requires** `confirm: true` and a non-empty
`reason` before it will run.

| Tool                     | Reference         | Description                                                  | Required args                             | Optional args                             | Status            |
| ------------------------ | ----------------- | ------------------------------------------------------------ | ----------------------------------------- | ----------------------------------------- | ------------------ |
| Disconnect Database User | `#disconnectUser` | Disconnects a user session by `connectionId`.                | `db`, `connectionId`, `confirm`, `reason` | `conn`                                    | 🚧 In progress |
| Clear Database Lock      | `#clearLock`      | Clears one or more locks; identify by lock/connection/table. | `db`, `confirm`, `reason`                 | `conn`, `lockId`, `connectionId`, `table` | 🚧 In progress |

## Argument notes

- **`db`** — logical database name; must match an entry in `openedge-project.json`.
- **`conn`** — full connection string (e.g. `-db sports2020 -H 127.0.0.1 -S 1234`).
  Pass credentials here (`-user admin -password secret`) when running the MCP
  server outside VS Code, which cannot read VS Code SecretStorage.
- **`fileNumber` / `recid`** (Get Record Field Details) — file number comes from
  `#getFileList`; `recid` identifies the target record.
- **`connectionId`** — for `#disconnectUser` / `#clearLock`, find it via
  `#getConnections` / `#getLocks` first; verify with the same tool afterwards.
- **`confirm` + `reason`** — safety gate on every action tool. The agent must pass
  `confirm: true` and explain _why_ in `reason`, otherwise the operation is rejected.

## Connections

Databases come from the shared **`openedge.abl`** configuration (managed by the
**[OpenEdge Config Management](config-management.md)** extension), resolved from `openedge-project.json`.
When no project config is found, the backend starts but exposes no database
connections.
