# OpenEdge Data Administration (Dictionary) — Agent Tools

**Extension:** [`AI4YOU.vscode-openedge-data-administration`](https://marketplace.visualstudio.com/items?itemName=AI4YOU.vscode-openedge-data-administration)
**MCP server key:** `openedge-dictionary`

The Data Administration (Dictionary) extension exposes OpenEdge schema
browsing, reporting, editing, and dump/load to AI agents. In chat, reference a
tool with `#<reference>` (e.g. `#listTables`).

## Read-only tools

These never modify data or schema and require no confirmation.

| Tool                   | Reference              | Description                                              | Required args                 | Optional args | Test D1            |
| ---------------------- | ---------------------- | -------------------------------------------------------- | ----------------------------- | ------------- | ------------------ |
| Health Check           | `#healthCheck`         | Check backend health and ABL connection status.          | —                             | —             | FUNCTIONAL         |
| Test Connection        | `#testConnection`      | Test that the backend can connect to the named database. | `database`                    | —             | FUNCTIONAL         |
| List Databases         | `#listDatabases`       | List all databases configured in the backend.            | —                             | —             | FUNCTIONAL         |
| List Tables            | `#listTables`          | List all tables in a database.                           | `database`                    | —             | FUNCTIONAL         |
| List Fields            | `#listFields`          | List all fields for a table.                             | `database`, `table`           | —             | FUNCTIONAL         |
| List Indexes           | `#listIndexes`         | List all indexes for a table.                            | `database`, `table`           | —             | FUNCTIONAL         |
| List Sequences         | `#listSequences`       | List all sequences in a database.                        | `database`                    | —             | FUNCTIONAL         |
| List Areas             | `#listAreas`           | List all storage areas in a database.                    | `database`                    | —             | FUNCTIONAL         |
| Get DB Properties      | `#getDbProperties`     | Get database-level properties.                           | `database`                    | —             | FUNCTIONAL         |
| Get Table Properties   | `#getTableProperties`  | Get properties for a specific table.                     | `database`, `table`           | —             | FUNCTIONAL         |
| Get Index Properties   | `#getIndexProperties`  | Get properties for a specific index.                     | `database`, `table`, `index`  | —             | FUNCTIONAL         |
| Get DB Identification  | `#getDbIdentification` | Get database identification information.                 | `database`                    | —             | FUNCTIONAL         |
| Check Trigger Syntax   | `#checkTriggerSyntax`  | Validate trigger ABL syntax (read-only, no changes).     | `database`, `body`            | —             | FUNCTIONAL         |
| Scan Inc DF Mismatches | `#scanIncDfMismatches` | Scan for schema mismatches between two databases.        | `database`, `compareDatabase` | —             | NOT FUNCTIONAL YET |

## Report tools

Read-only quick reports. No confirmation required.

| Tool            | Reference         | Description                        | Required args | Optional args | Test D1    |
| --------------- | ----------------- | ---------------------------------- | ------------- | ------------- | ---------- |
| Report Table    | `#reportTable`    | Quick table report for a database. | `database`    | —             | FUNCTIONAL |
| Report Field    | `#reportField`    | Quick field report.                | `database`    | `table`       | FUNCTIONAL |
| Report Index    | `#reportIndex`    | Quick index report.                | `database`    | `table`       | FUNCTIONAL |
| Report Sequence | `#reportSequence` | Quick sequence report.             | `database`    | —             | FUNCTIONAL |
| Report View     | `#reportView`     | Quick view report.                 | `database`    | —             | FUNCTIONAL |
| Report Trigger  | `#reportTrigger`  | Quick trigger report.              | `database`    | —             | FUNCTIONAL |
| Report User     | `#reportUser`     | Quick user report.                 | `database`    | —             | FUNCTIONAL |

## Dump tools (write files)

These write definition/data files to disk but do not modify the database.

| Tool                 | Reference             | Description                                         | Required args                               | Optional args | Test D1            |
| -------------------- | --------------------- | --------------------------------------------------- | ------------------------------------------- | ------------- | ------------------ |
| Dump DF              | `#dumpDf`             | Dump database schema definition to a `.df` file.    | `database`, `outputPath`                    | —             | FUNCTIONAL         |
| Dump Incremental DF  | `#dumpIncrementalDf`  | Dump incremental schema diff between two databases. | `database`, `compareDatabase`, `outputPath` | —             | NOT FUNCTIONAL YET |
| Dump Data            | `#dumpData`           | Dump table data to files.                           | `database`, `outputDirectory`               | `tables`      | FUNCTIONAL         |
| Dump Sequence Values | `#dumpSequenceValues` | Dump current sequence values to a file.             | `database`, `outputPath`                    | —             | FUNCTIONAL         |

## Schema-editing tools (require confirmation)

These mutate schema. Each **requires** a `confirmation` object with
`confirmed: true`, the exact `confirmationText`, and a non-empty `reason`.

| Tool                       | Reference                   | Description                          | Required args                           | Confirmation text        | Test D1            |
| -------------------------- | --------------------------- | ------------------------------------ | --------------------------------------- | ------------------------ | ------------------ |
| Create Database            | `#createDatabase`           | Create a new OpenEdge database.      | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | NOT FUNCTIONAL YET |
| Create Table               | `#createTable`              | Create a new table.                  | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | FUNCTIONAL         |
| Create Field               | `#createField`              | Create a new field in a table.       | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | FUNCTIONAL         |
| Create Index               | `#createIndex`              | Create a new index on a table.       | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | NOT FUNCTIONAL YET |
| Create Sequence            | `#createSequence`           | Create a new sequence.               | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | FUNCTIONAL         |
| Update Database Properties | `#updateDatabaseProperties` | Update database-level properties.    | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | FUNCTIONAL         |
| Update Table Properties    | `#updateTableProperties`    | Update properties for a table.       | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | NOT FUNCTIONAL YET |
| Update Index Properties    | `#updateIndexProperties`    | Update properties for an index.      | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | FUNCTIONAL         |
| Update Field               | `#updateField`              | Update field definition.             | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | NOT FUNCTIONAL YET |
| Update Sequence            | `#updateSequence`           | Update sequence properties.          | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | NOT FUNCTIONAL YET |
| Update DB Identification   | `#updateDbIdentification`   | Update database identification info. | `database`, `body`, `confirmation`      | `APPLY TO <database>`    | NOT FUNCTIONAL YET |
| Delete Table               | `#deleteTable`              | Delete a table.                      | `database`, `tableName`, `confirmation` | `DELETE FROM <database>` | NOT FUNCTIONAL YET |
| Delete Field               | `#deleteField`              | Delete a field from a table.         | `database`, `body`, `confirmation`      | `DELETE FROM <database>` | NOT FUNCTIONAL YET |
| Delete Index               | `#deleteIndex`              | Delete an index from a table.        | `database`, `body`, `confirmation`      | `DELETE FROM <database>` | FUNCTIONAL         |
| Delete Sequence            | `#deleteSequence`           | Delete a sequence.                   | `database`, `body`, `confirmation`      | `DELETE FROM <database>` | FUNCTIONAL         |

## Load tools (require confirmation)

These mutate the target database. Each **requires** a `confirmation` object.

| Tool      | Reference   | Description                                     | Required args                               | Confirmation text      | Test D1            |
| --------- | ----------- | ----------------------------------------------- | ------------------------------------------- | ---------------------- | ------------------ |
| Load DF   | `#loadDf`   | Load a `.df` schema definition into a database. | `database`, `dfFilePath`, `confirmation`    | `LOAD INTO <database>` | NOT FUNCTIONAL YET |
| Load Data | `#loadData` | Load table data from files into a database.     | `database`, `dataDirectory`, `confirmation` | `LOAD INTO <database>` | NOT FUNCTIONAL YET |

## Database lifecycle & ops tools

These operate on the database/AdminServer level via `dbPath` (absolute path to
the `.db` file) rather than a logical connection. Start/backup operations
require confirmation (`APPLY TO <target>`); stop/restore/kill are
**destructive** and require the exact `DELETE FROM <target>` confirmation text.

| Tool                      | Reference                | Description                                                | Required args                          | Confirmation                                                            | Test D1            |
| ------------------------- | ------------------------ | ---------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------- | ------------------ |
| Database Status           | `#databaseStatus`        | Current status of a database (running or stopped).         | `dbPath`                               | —                                                                       | NOT FUNCTIONAL YET |
| Start Database            | `#startDatabase`         | Start a database broker (single-user mode) via `proserve`. | `dbPath`, `confirmation`               | `APPLY TO <dbPath>`                                                     | NOT FUNCTIONAL YET |
| Start Database (Proserve) | `#startDatabaseProserve` | Start a multi-user broker via `proserve`.                  | `dbPath`, `confirmation`               | `APPLY TO <dbPath>` (optional `port`, `maxUsers`, `minPort`, `maxPort`) | NOT FUNCTIONAL YET |
| Stop Database             | `#stopDatabase`          | Stop a running broker via `proshut`. **Destructive.**      | `dbPath`, `confirmation`               | `DELETE FROM <dbPath>`                                                  | NOT FUNCTIONAL YET |
| Backup Database           | `#backupDatabase`        | Back up a database via `probkup` (offline or `online`).    | `dbPath`, `backupPath`, `confirmation` | `APPLY TO <dbPath>`                                                     | NOT FUNCTIONAL YET |
| Restore Database          | `#restoreDatabase`       | Restore from a backup via `prorest`. **Destructive.**      | `dbPath`, `backupPath`, `confirmation` | `DELETE FROM <dbPath>`                                                  | NOT FUNCTIONAL YET |
| Validate Database         | `#validateDatabase`      | Validate structure and indexes via `proutil`.              | `dbPath`                               | — (optional `indexes`)                                                  | NOT FUNCTIONAL YET |
| AdminServer Status        | `#adminserverStatus`     | Current status of the OpenEdge AdminServer.                | —                                      | —                                                                       | NOT FUNCTIONAL YET |
| AdminServer Start         | `#adminserverStart`      | Start the AdminServer service.                             | `confirmation`                         | `APPLY TO AdminServer`                                                  | NOT FUNCTIONAL YET |
| AdminServer Stop          | `#adminserverStop`       | Stop the AdminServer service. **Destructive.**             | `confirmation`                         | `DELETE FROM AdminServer`                                               | NOT FUNCTIONAL YET |

## Environment & process tools

Read-only system inspection, plus one destructive process action.

| Tool                      | Reference                  | Description                                             | Required args         | Confirmation                                              | Test D1            |
| ------------------------- | -------------------------- | ------------------------------------------------------- | --------------------- | --------------------------------------------------------- | ------------------ |
| OpenEdge Environment Info | `#openedgeEnvironmentInfo` | DLC path, version, PROPATH, OPSYS, etc.                 | —                     | —                                                         | NOT FUNCTIONAL YET |
| System Resources          | `#systemResources`         | CPU, memory, and disk utilization relevant to OpenEdge. | —                     | —                                                         | NOT FUNCTIONAL YET |
| Progress Processes        | `#progressProcesses`       | List all running OpenEdge/Progress processes.           | —                     | —                                                         | NOT FUNCTIONAL YET |
| Kill Progress Process     | `#killProgressProcess`     | Kill a Progress process by PID. **Destructive.**        | `pid`, `confirmation` | `DELETE FROM <pid>` (optional `signal`: `TERM` \| `KILL`) | NOT FUNCTIONAL YET |

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
