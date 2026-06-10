# OpenEdge Config Management — Agent Tools

**Extension:** [`AI4YOU.openedge-config-management`](https://marketplace.visualstudio.com/items?itemName=AI4YOU.openedge-config-management)
**MCP server key:** `openedge-tooling`

Config Management is the **central owner of shared OpenEdge ABL configuration**
(database connections, runtime/DLC, project discovery) for all AI4YOU OpenEdge
extensions. It also exposes ABL scaffolding, compile, and run capabilities to AI
agents. In chat, reference a tool with `#<reference>`
(e.g. `#openedgeToolingCompile`).

## Tools

| Tool | Reference | Description | Required args | Optional args |
|---|---|---|---|---|
| Create ABL File | `#openedgeToolingCreateAblFile` | Creates a new ABL source file (`.p`, `.cls`, `.i`, `.w`) from a framework template. | `fileType`, `name` | `targetDirectory`, `framework` (`none` \| `fly2pro` \| `consultingwerk`) |
| Initialize Project Config | `#openedgeToolingInitProjectConfig` | Creates `openedge-project.json` with defaults; prompts to overwrite if it exists. | — | `folderUri` |
| Add Database | `#openedgeToolingDbAdd` | Adds a `dbConnections` entry to `openedge-project.json` (creates the file if missing). | `dbName` | `dbPath`, `host`, `port` |
| Start All Databases | `#openedgeToolingDbStartAll` | Starts each local database from `openedge-project.json` using `proserve`. | — | `folderUri` |
| Schema Dump Entrypoint | `#openedgeToolingDumpSchema` | Generates and runs an ABL procedure that dumps the database schema to a `.df` file. | `dbName`, `dfPath` | `dbDir`, `framework` |
| Compile OpenEdge Code | `#openedgeToolingCompile` | Compiles an ABL file (`.p`, `.cls`, `.w`) using the configured runtime; returns errors. | `filePath` | `options` (`XREF`, `DEBUG-LIST`, `LISTING`, `PREPROCESS`) |
| Run OpenEdge Procedure | `#openedgeToolingRun` | Runs an ABL file via `prowin` (GUI), `_progres` (CHUI), or batch. | `filePath` | `mode` (`gui` \| `chui` \| `batch`), `params` |

## MCP server

The extension contributes an MCP server definition provider
(`openedgeConfigManagementProvider`, server key **`openedge-tooling`**) and
manages the server lifecycle through commands:

- `openedge-tooling.startMcpServer` / `stopMcpServer` / `restartMcpServer`
- `openedge-tooling.mcpServerStatus`, `openedge-tooling.showMcpLogs`
- `openedge-tooling.removeMcpConfigNow` — removes the `mcp.json` entry

## Command groups (`openedge-tooling.*`)

| Area | Commands |
|---|---|
| Settings / init | `showSettings`, `initializeProjectConfig`, `resetProjectConfig`, `initializeWorkspaceProjects` |
| Scaffolding (New ABL File…) | `createClass`, `createProcedure`, `createInclude`, `createInterface`, `createEnum`, `createForm`, `createDialog`, `createBusinessEntity`, `createWebHandler`, test case/suite variants, and more |
| Source tools | `addMethod`, `addConstructor`, `addDestructor`, `addProcedure`, `addFunction`, `updateFunctionPrototypes`, `toggleLineComment`, `toggleBlockComment` |
| Compile | `compileWithOptions`, `compileWithXref`, `compileWithDebugList`, `compileWithListing`, `compileWithPreprocess` |
| Run | `runGui`, `runChui`, `runBatch` |
| Analysis | `analyzeComponents`, `createUpdateAssembliesXml` |

## Shared configuration contract

This extension owns the **`openedge.abl`** settings namespace that the other
AI4YOU extensions (DataDigger, Data Administration, HCK, PASOE, OpenAPI)
consume:

- `openedge.abl.dbConnections[]` — each `{ "connect": "-db mydb -H localhost -S 12345" }`,
  optionally with a friendly `name`.
- Runtime/DLC paths and project discovery settings.

Configure connections once via **Settings → OpenEdge ABL → Db Connections** and
every tool in the pack uses them.

---

_Source of truth: `languageModelTools` in the extension's `package.json`. Keep this page in sync when tools change._
