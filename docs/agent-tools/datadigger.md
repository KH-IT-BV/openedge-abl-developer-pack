# OpenEdge DataDigger — Agent Tools

**Extension:** [`AI4YOU.vscode-openedge-datadigger`](https://marketplace.visualstudio.com/items?itemName=AI4YOU.vscode-openedge-datadigger)
**MCP server key:** `openedge-datadigger`

DataDigger exposes its database browser/editor capabilities to AI agents so they
can inspect schema and query/modify data directly. In chat, reference a tool with
`#<reference>` (e.g. `#queryTable`).

## Read-only tools

These never modify data and require no confirmation.

| Tool           | Reference        | Description                                                  | Required args       | Optional args                                                                  | Test D1            |
| -------------- | ---------------- | ------------------------------------------------------------ | ------------------- | ------------------------------------------------------------------------------ | ------------------ |
| List Databases | `#listDatabases` | Lists all databases configured in the DataDigger connection. | —                   | `database` (name filter)                                                       | NOT FUNCTIONAL YET |
| List Tables    | `#listTables`    | Lists all tables in the specified database.                  | `database`          | —                                                                              | FUNCTIONAL         |
| Describe Table | `#describeTable` | Returns field definitions for a table.                       | `database`, `table` | —                                                                              | FUNCTIONAL         |
| List Indexes   | `#listIndexes`   | Returns index definitions for a table.                       | `database`, `table` | —                                                                              | FUNCTIONAL         |
| Query Table    | `#queryTable`    | Queries rows with optional filter, pagination, and sorting.  | `database`, `table` | `filter` (WHERE without keyword), `limit`, `offset`, `sortBy`, `sortAscending` | FUNCTIONAL         |
| Count Table    | `#countTable`    | Returns the exact row count matching an optional filter.     | `database`, `table` | `filter`                                                                       | NOT FUNCTIONAL YET |

## Write tools (require confirmation)

These mutate data or write files. Each **requires** `confirm: true` and a
non-empty `reason` before it will run.

| Tool         | Reference      | Description                      | Required args                                                      | Optional args                                                                           | Test D1    |
| ------------ | -------------- | -------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ---------- |
| Insert Row   | `#insertRow`   | Inserts a new row into a table.  | `database`, `table`, `row`, `confirm`, `reason`                    | —                                                                                       | FUNCTIONAL |
| Update Row   | `#updateRow`   | Updates an existing row.         | `database`, `table`, `originalRow`, `changes`, `confirm`, `reason` | —                                                                                       | FUNCTIONAL |
| Delete Row   | `#deleteRow`   | Deletes a row from a table.      | `database`, `table`, `row`, `confirm`, `reason`                    | —                                                                                       | FUNCTIONAL |
| Export Query | `#exportQuery` | Exports query results to a file. | `database`, `table`, `outputPath`, `confirm`, `reason`             | `where`, `format` (`XML` \| `JSON` \| `CSV` \| `TXT` \| `4GL` \| `Progress`), `options` | FUNCTIONAL |

## Argument notes

- **`filter` / `where`** — an ABL `WHERE` clause **without** the `WHERE` keyword.
- **`row` / `originalRow` / `changes` / `options`** — free-form objects
  (field/value maps); additional properties are allowed.
- **`confirm` + `reason`** — safety gate on every write tool. The agent must pass
  `confirm: true` and explain _why_ in `reason`, otherwise the operation is rejected.
- **`format`** (Export Query) — one of `XML`, `JSON`, `CSV`, `TXT`, `4GL`, `Progress`.

## Connections

Databases come from the shared **`openedge.abl`** configuration (managed by the
**[OpenEdge Config Management](config-management.md)** extension). Configure
connections once via **Settings → OpenEdge ABL → Db Connections**.

---

_Source of truth: `languageModelTools` in the extension's `package.json`. Keep this page in sync when tools change._
