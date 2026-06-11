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

### Database tools

| Tool | Reference | Description | Required args | Optional args | Status |
|---|---|---|---|---|---|
| Create Database | `#create_database` | Create a new Progress database. | `databaseName`, `databasePath` | `blockSize`, `beforeImagePath`, `afterImagePath` | 🚧 In progress |
| Start Database | `#start_database` | Start a Progress database. | `databasePath` | `multiUser`, `maxUsers`, `buffers`, `serverPort` | 🚧 In progress |
| Stop Database | `#stop_database` | Stop a Progress database. | `databasePath` | `immediate` | 🚧 In progress  |
| Database Status | `#database_status` | Get database status information. | `databasePath` | — | 🚧 In progress  |
| List Databases | `#list_databases` | List all databases in a directory. | — | `searchDirectory` | 🟡 Validation 1/2 |
| Backup Database | `#backup_database` | Back up a Progress database. | `databasePath`, `destination`, `type` | `online`, `verify`, `compress` | 🚧 In progress |
| Restore Database | `#restore_database` | Restore a Progress database from backup. | `databasePath`, `backupPath` | — | 🚧 In progress |
| Validate Database | `#validate_database` | Validate database integrity. | `databasePath` | — | 🚧 In progress |

### PASOE tools

| Tool | Reference | Description | Required args | Optional args | Status |
|---|---|---|---|---|---|
| Create PASOE Instance | `#create_pasoe_instance` | Create a new PASOE instance. | `instanceName`, `instancePath` | `port`, `protocol` (`http` \| `https`) | 🚧 In progress |
| Start PASOE Instance | `#start_pasoe_instance` | Start a PASOE instance. | `instanceName` | — | 🟡 Validation 1/2 |
| Stop PASOE Instance | `#stop_pasoe_instance` | Stop a PASOE instance. | `instanceName` | `graceful` | 🟡 Validation 1/2 |
| List PASOE Instances | `#list_pasoe_instances` | List all PASOE instances. | — | — | 🟡 Validation 1/2 |
| Deploy Application | `#deploy_application` | Deploy an application to a PASOE instance. | `instanceName`, `applicationPath` | `applicationName` | 🚧 In progress |

### AdminServer tools

| Tool | Reference | Description | Required args | Optional args | Status |
|---|---|---|---|---|---|
| Start AdminServer | `#start_adminserver` | Start OpenEdge AdminServer. | — | `port` | 🚧 In progress |
| Stop AdminServer | `#stop_adminserver` | Stop OpenEdge AdminServer. | — | — | 🚧 In progress |
| AdminServer Status | `#adminserver_status` | Get AdminServer status. | — | — | 🚧 In progress |

### System tools

| Tool | Reference | Description | Required args | Optional args | Status |
|---|---|---|---|---|---|
| OpenEdge Environment Info | `#openedge_environment_info` | Get OpenEdge environment information. | — | — | 🟡 Validation 1/2 |
| System Resources | `#system_resources` | Get system resource usage. | — | — | 🟡 Validation 1/2 |
| Progress Processes | `#progress_processes` | Get the list of running Progress processes. | — | — | 🟡 Validation 1/2 |
| Kill Progress Process | `#kill_progress_process` | Terminate a Progress process. | `pid` | `force` | 🟡 Validation 1/2 |

### Development tools

| Tool | Reference | Description | Required args | Optional args | Status |
|---|---|---|---|---|---|
| Compile Progress Code | `#compile_progress_code` | Compile Progress 4GL code. | `sourceFile` | `listingFile`, `rCodeDir`, `minSize` | 🚧 In progress |
| Run Progress Procedure | `#run_progress_procedure` | Execute a Progress 4GL procedure. | `procedure` | `parameters`, `databasePath` | 🚧 In progress |
| Test Database Connection | `#test_database_connection` | Test database connectivity. | `databasePath` | `userId` | 🟡 Validation 1/2 |

### Server lifecycle commands

| Area | Commands |
|---|---|
| MCP server lifecycle | `openedge-tooling.startMcpServer`, `openedge-tooling.stopMcpServer`, `openedge-tooling.restartMcpServer` |
| MCP diagnostics | `openedge-tooling.mcpServerStatus`, `openedge-tooling.showMcpLogs`, `openedge-tooling.removeMcpConfigNow` |

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
