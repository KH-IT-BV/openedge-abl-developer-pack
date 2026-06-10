# OpenEdge Data Administration (Dictionary) — Agent Tools

**Extension:** [`AI4YOU.vscode-openedge-data-administration`](https://marketplace.visualstudio.com/items?itemName=AI4YOU.vscode-openedge-data-administration)
**MCP server key:** `openedge-dictionary`

The Data Administration (Dictionary) extension exposes OpenEdge schema
browsing, reporting, editing, and dump/load to AI agents. In chat, reference a
tool with `#<reference>` (e.g. `#listTables`).

## Read-only tools

These never modify data or schema and require no confirmation.

| Tool | Reference | Description | Required args | Optional args |
|---|---|---|---|---|
| Health Check | `#healthCheck` | Check backend health and ABL connection status. | — | — |
| Test Connection | `#testConnection` | Test that the backend can connect to the named database. | `database` | — |
| List Databases | `#listDatabases` | List all databases configured in the backend. | — | — |
| List Tables | `#listTables` | List all tables in a database. | `database` | — |
| List Fields | `#listFields` | List all fields for a table. | `database`, `table` | — |
| List Indexes | `#listIndexes` | List all indexes for a table. | `database`, `table` | — |
| List Sequences | `#listSequences` | List all sequences in a database. | `database` | — |
| List Areas | `#listAreas` | List all storage areas in a database. | `database` | — |
| Get DB Properties | `#getDbProperties` | Get database-level properties. | `database` | — |
| Get Table Properties | `#getTableProperties` | Get properties for a specific table. | `database`, `table` | — |
| Get Index Properties | `#getIndexProperties` | Get properties for a specific index. | `database`, `table`, `index` | — |
| Get DB Identification | `#getDbIdentification` | Get database identification information. | `database` | — |
| Check Trigger Syntax | `#checkTriggerSyntax` | Validate trigger ABL syntax (read-only, no changes). | `database`, `body` | — |
| Scan Inc DF Mismatches | `#scanIncDfMismatches` | Scan for schema mismatches between two databases. | `database`, `compareDatabase` | — |

## Report tools

Read-only quick reports. No confirmation required.

| Tool | Reference | Description | Required args | Optional args |
|---|---|---|---|---|
| Report Table | `#reportTable` | Quick table report for a database. | `database` | — |
| Report Field | `#reportField` | Quick field report. | `database` | `table` |
| Report Index | `#reportIndex` | Quick index report. | `database` | `table` |
| Report Sequence | `#reportSequence` | Quick sequence report. | `database` | — |
| Report View | `#reportView` | Quick view report. | `database` | — |
| Report Trigger | `#reportTrigger` | Quick trigger report. | `database` | — |
| Report User | `#reportUser` | Quick user report. | `database` | — |

## Dump tools (write files)

These write definition/data files to disk but do not modify the database.

| Tool | Reference | Description | Required args | Optional args |
|---|---|---|---|---|
| Dump DF | `#dumpDf` | Dump database schema definition to a `.df` file. | `database`, `outputPath` | — |
| Dump Incremental DF | `#dumpIncrementalDf` | Dump incremental schema diff between two databases. | `database`, `compareDatabase`, `outputPath` | — |
| Dump Data | `#dumpData` | Dump table data to files. | `database`, `outputDirectory` | `tables` |
| Dump Sequence Values | `#dumpSequenceValues` | Dump current sequence values to a file. | `database`, `outputPath` | — |

## Schema-editing tools (require confirmation)

These mutate schema. Each **requires** a `confirmation` object with
`confirmed: true`, the exact `confirmationText`, and a non-empty `reason`.

| Tool | Reference | Description | Required args | Confirmation text |
|---|---|---|---|---|
| Create Database | `#createDatabase` | Create a new OpenEdge database. | `database`, `body`, `confirmation` | `APPLY TO <database>` |
| Create Table | `#createTable` | Create a new table. | `database`, `body`, `confirmation` | `APPLY TO <database>` |
| Create Field | `#createField` | Create a new field in a table. | `database`, `body`, `confirmation` | `APPLY TO <database>` |
| Create Index | `#createIndex` | Create a new index on a table. | `database`, `body`, `confirmation` | `APPLY TO <database>` |
| Create Sequence | `#createSequence` | Create a new sequence. | `database`, `body`, `confirmation` | `APPLY TO <database>` |
| Update Database Properties | `#updateDatabaseProperties` | Update database-level properties. | `database`, `body`, `confirmation` | `APPLY TO <database>` |
| Update Table Properties | `#updateTableProperties` | Update properties for a table. | `database`, `body`, `confirmation` | `APPLY TO <database>` |
| Update Index Properties | `#updateIndexProperties` | Update properties for an index. | `database`, `body`, `confirmation` | `APPLY TO <database>` |
| Update Field | `#updateField` | Update field definition. | `database`, `body`, `confirmation` | `APPLY TO <database>` |
| Update Sequence | `#updateSequence` | Update sequence properties. | `database`, `body`, `confirmation` | `APPLY TO <database>` |
| Update DB Identification | `#updateDbIdentification` | Update database identification info. | `database`, `body`, `confirmation` | `APPLY TO <database>` |
| Delete Table | `#deleteTable` | Delete a table. | `database`, `tableName`, `confirmation` | `DELETE FROM <database>` |
| Delete Field | `#deleteField` | Delete a field from a table. | `database`, `body`, `confirmation` | `DELETE FROM <database>` |
| Delete Index | `#deleteIndex` | Delete an index from a table. | `database`, `body`, `confirmation` | `DELETE FROM <database>` |
| Delete Sequence | `#deleteSequence` | Delete a sequence. | `database`, `body`, `confirmation` | `DELETE FROM <database>` |

## Load tools (require confirmation)

These mutate the target database. Each **requires** a `confirmation` object.

| Tool | Reference | Description | Required args | Confirmation text |
|---|---|---|---|---|
| Load DF | `#loadDf` | Load a `.df` schema definition into a database. | `database`, `dfFilePath`, `confirmation` | `LOAD INTO <database>` |
| Load Data | `#loadData` | Load table data from files into a database. | `database`, `dataDirectory`, `confirmation` | `LOAD INTO <database>` |

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
**OpenEdge Config Management** extension). Configure connections once via
**Settings → OpenEdge ABL → Db Connections**.
