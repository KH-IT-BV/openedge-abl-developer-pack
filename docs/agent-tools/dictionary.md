# OpenEdge Data Administration (Dictionary) — Agent Tools

**Extension:** [`AI4YOU.vscode-openedge-data-administration`](https://marketplace.visualstudio.com/items?itemName=AI4YOU.vscode-openedge-data-administration)
**MCP server key:** `openedge-dictionary`

The Data Administration (Dictionary) extension exposes OpenEdge schema
browsing, reporting, editing, and dump/load to AI agents. In chat, reference a
tool with `#<reference>` (e.g. `#listTables`).

## Read-only tools

These never modify data or schema and require no confirmation.

| Tool                   | Reference              | Description                                              | Required args                 | Optional args | Status            |
| ---------------------- | ---------------------- | -------------------------------------------------------- | ----------------------------- | ------------- | ------------------ |
| Health Check           | `#healthCheck`         | Check backend health and ABL connection status.          | —                             | —             | 🟡 Validation 1/2         |
| Test Connection        | `#testConnection`      | Test that the backend can connect to the named database. | `database`                    | —             | 🟡 Validation 1/2         |
| List Databases         | `#listDatabases`       | List all databases configured in the backend.            | —                             | —             | 🟡 Validation 1/2         |
| List Tables            | `#listTables`          | List all tables in a database.                           | `database`                    | —             | 🟡 Validation 1/2         |
| List Fields            | `#listFields`          | List all fields for a table.                             | `database`, `table`           | —             | 🟡 Validation 1/2         |
| List Indexes           | `#listIndexes`         | List all indexes for a table.                            | `database`, `table`           | —             | 🟡 Validation 1/2         |
| List Sequences         | `#listSequences`       | List all sequences in a database.                        | `database`                    | —             | 🟡 Validation 1/2         |
| List Areas             | `#listAreas`           | List all storage areas in a database.                    | `database`                    | —             | 🟡 Validation 1/2         |
| Get DB Properties      | `#getDbProperties`     | Get database-level properties.                           | `database`                    | —             | 🟡 Validation 1/2         |
| Get Table Properties   | `#getTableProperties`  | Get properties for a specific table.                     | `database`, `table`           | —             | 🟡 Validation 1/2         |
| Get Index Properties   | `#getIndexProperties`  | Get properties for a specific index.                     | `database`, `table`, `index`  | —             | 🟡 Validation 1/2         |
| Get DB Identification  | `#getDbIdentification` | Get database identification information.                 | `database`                    | —             | 🟡 Validation 1/2         |
| Check Trigger Syntax   | `#checkTriggerSyntax`  | Validate trigger ABL syntax (read-only, no changes).     | `database`, `body`            | —             | 🟡 Validation 1/2         |
| Scan Inc DF Mismatches | `#scanIncDfMismatches` | Scan for schema mismatches between two databases.        | `database`, `compareDatabase` | —             | 🚧 In progress |

## Report tools

Read-only quick reports. No confirmation required.

| Tool            | Reference         | Description                        | Required args | Optional args | Status    |
| --------------- | ----------------- | ---------------------------------- | ------------- | ------------- | ---------- |
| Report Table    | `#reportTable`    | Quick table report for a database. | `database`    | —             | 🟡 Validation 1/2 |
| Report Field    | `#reportField`    | Quick field report.                | `database`    | `table`       | 🟡 Validation 1/2 |
| Report Index    | `#reportIndex`    | Quick index report.                | `database`    | `table`       | 🟡 Validation 1/2 |
| Report Sequence | `#reportSequence` | Quick sequence report.             | `database`    | —             | 🟡 Validation 1/2 |
| Report View     | `#reportView`     | Quick view report.                 | `database`    | —             | 🟡 Validation 1/2 |
| Report Trigger  | `#reportTrigger`  | Quick trigger report.              | `database`    | —             | 🟡 Validation 1/2 |
| Report User     | `#reportUser`     | Quick user report.                 | `database`    | —             | 🟡 Validation 1/2 |

## Dump tools (write files)

These write definition/data files to disk but do not modify the database.

| Tool                 | Reference             | Description                                         | Required args                               | Optional args | Status            |
| -------------------- | --------------------- | --------------------------------------------------- | ------------------------------------------- | ------------- | ------------------ |
| Dump DF              | `#dumpDf`             | Dump database schema definition to a `.df` file.    | `database`, `outputPath`                    | —             | 🟡 Validation 1/2         |
| Dump Incremental DF  | `#dumpIncrementalDf`  | Dump incremental schema diff between two databases. | `database`, `compareDatabase`, `outputPath` | —             | 🚧 In progress |
| Dump Data            | `#dumpData`           | Dump table data to files.                           | `database`, `outputDirectory`               | `tables`      | 🟡 Validation 1/2         |
| Dump Sequence Values | `#dumpSequenceValues` | Dump current sequence values to a file.             | `database`, `outputPath`                    | —             | 🟡 Validation 1/2         |

## Schema-editing tools (require confirmation)

These mutate schema. Each **requires** a `confirmation` object with
`confirmed: true`, the exact `confirmationText`, and a non-empty `reason`.

| Tool                       | Reference                   | Description                          | Required args                           | Confirmation text        | Status            |
| -------------------------- | --------------------------- | ------------------------------------ | --------------------------------------- | ------------------------ | ------------------ |
| Create Database            | `#createDatabase`           | Create a new OpenEdge database.      | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | 🚧 In progress |
| Create Table               | `#createTable`              | Create a new table.                  | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | 🟡 Validation 1/2         |
| Create Field               | `#createField`              | Create a new field in a table.       | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | 🟡 Validation 1/2         |
| Create Index               | `#createIndex`              | Create a new index on a table.       | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | 🚧 In progress |
| Create Sequence            | `#createSequence`           | Create a new sequence.               | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | 🟡 Validation 1/2         |
| Update Database Properties | `#updateDatabaseProperties` | Update database-level properties.    | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | 🟡 Validation 1/2         |
| Update Table Properties    | `#updateTableProperties`    | Update properties for a table.       | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | 🚧 In progress |
| Update Index Properties    | `#updateIndexProperties`    | Update properties for an index.      | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | 🟡 Validation 1/2         |
| Update Field               | `#updateField`              | Update field definition.             | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | 🚧 In progress |
| Update Sequence            | `#updateSequence`           | Update sequence properties.          | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | 🚧 In progress |
| Update DB Identification   | `#updateDbIdentification`   | Update database identification info. | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | 🚧 In progress |
| Delete Table               | `#deleteTable`              | Delete a table.                      | `database`, `tableName`, `confirmation` | `DELETE FROM <database>` | 🚧 In progress |
| Delete Field               | `#deleteField`              | Delete a field from a table.         | `database`, `body`, `confirmation`      | `DELETE FROM <database>` | 🚧 In progress |
| Delete Index               | `#deleteIndex`              | Delete an index from a table.        | `database`, `body`, `confirmation`      | `DELETE FROM <database>` | 🟡 Validation 1/2         |
| Delete Sequence            | `#deleteSequence`           | Delete a sequence.                   | `database`, `body`, `confirmation`      | `DELETE FROM <database>` | 🟡 Validation 1/2         |

## Load tools (require confirmation)

These mutate the target database. Each **requires** a `confirmation` object.

| Tool      | Reference   | Description                                     | Required args                               | Confirmation text      | Status            |
| --------- | ----------- | ----------------------------------------------- | ------------------------------------------- | ---------------------- | ------------------ |
| Load DF   | `#loadDf`   | Load a `.df` schema definition into a database. | `database`, `dfFilePath`, `confirmation`    | `LOAD INTO <database>` | 🚧 In progress |
| Load Data | `#loadData` | Load table data from files into a database.     | `database`, `dataDirectory`, `confirmation` | `LOAD INTO <database>` | 🚧 In progress |

## Database lifecycle & ops tools

These operate on the database/AdminServer level via `dbPath` (absolute path to
the `.db` file) rather than a logical connection. Start/backup operations
require confirmation (`APPLY TO <target>`); stop/restore/kill are
**destructive** and require the exact `DELETE FROM <target>` confirmation text.

| Tool                      | Reference                | Description                                                | Required args                          | Confirmation                                                            | Status            |
| ------------------------- | ------------------------ | ---------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------- | ------------------ |
| Database Status           | `#databaseStatus`        | Current status of a database (running or stopped).         | `dbPath`                               | —                                                                       | 🚧 In progress |
| Start Database            | `#startDatabase`         | Start a database broker (single-user mode) via `proserve`. | `dbPath`, `confirmation`               | `APPLY TO <dbPath>`                                                     | 🚧 In progress |
| Start Database (Proserve) | `#startDatabaseProserve` | Start a multi-user broker via `proserve`.                  | `dbPath`, `confirmation`               | `APPLY TO <dbPath>` (optional `port`, `maxUsers`, `minPort`, `maxPort`) | 🚧 In progress |
| Stop Database             | `#stopDatabase`          | Stop a running broker via `proshut`. **Destructive.**      | `dbPath`, `confirmation`               | `DELETE FROM <dbPath>`                                                  | 🚧 In progress |
| Backup Database           | `#backupDatabase`        | Back up a database via `probkup` (offline or `online`).    | `dbPath`, `backupPath`, `confirmation` | `APPLY TO <dbPath>`                                                     | 🚧 In progress |
| Restore Database          | `#restoreDatabase`       | Restore from a backup via `prorest`. **Destructive.**      | `dbPath`, `backupPath`, `confirmation` | `DELETE FROM <dbPath>`                                                  | 🚧 In progress |
| Validate Database         | `#validateDatabase`      | Validate structure and indexes via `proutil`.              | `dbPath`                               | — (optional `indexes`)                                                  | 🚧 In progress |
| AdminServer Status        | `#adminserverStatus`     | Current status of the OpenEdge AdminServer.                | —                                      | —                                                                       | 🚧 In progress |
| AdminServer Start         | `#adminserverStart`      | Start the AdminServer service.                             | `confirmation`                         | `APPLY TO AdminServer`                                                  | 🚧 In progress |
| AdminServer Stop          | `#adminserverStop`       | Stop the AdminServer service. **Destructive.**             | `confirmation`                         | `DELETE FROM AdminServer`                                               | 🚧 In progress |

## Environment & process tools

Read-only system inspection, plus one destructive process action.

| Tool                      | Reference                  | Description                                             | Required args         | Confirmation                                              | Status            |
| ------------------------- | -------------------------- | ------------------------------------------------------- | --------------------- | --------------------------------------------------------- | ------------------ |
| OpenEdge Environment Info | `#openedgeEnvironmentInfo` | DLC path, version, PROPATH, OPSYS, etc.                 | —                     | —                                                         | 🚧 In progress |
| System Resources          | `#systemResources`         | CPU, memory, and disk utilization relevant to OpenEdge. | —                     | —                                                         | 🚧 In progress |
| Progress Processes        | `#progressProcesses`       | List all running OpenEdge/Progress processes.           | —                     | —                                                         | 🚧 In progress |
| Kill Progress Process     | `#killProgressProcess`     | Kill a Progress process by PID. **Destructive.**        | `pid`, `confirmation` | `DELETE FROM <pid>` (optional `signal`: `TERM` \| `KILL`) | 🚧 In progress |

## Argument notes

- **`database`** — logical database name; must match a configured connection.
- **`body`** — the operation payload (table/field/index/sequence definition or
  property set). Shape depends on the tool.
- **`confirmation`** — safety gate on every write/load tool. Pass an object:
  - `confirmed: true`
  - `confirmationText` — the **exact** string for the operation:
    `APPLY TO <database>` (create/update), `DELETE FROM <database>` (delete),
    or `LOAD INTO <database>` (load).
  - `reason` — non-empty human-readable justification.
- **Destructive operations** (`delete*`, `load*`) must not be run against
  production databases unless the user has explicitly identified the target and
  approved the exact operation.

## Connections

Databases come from the shared **`openedge.abl`** configuration (managed by the
**[OpenEdge Config Management](config-management.md)** extension). Configure
connections once via **Settings → OpenEdge ABL → Db Connections**.
