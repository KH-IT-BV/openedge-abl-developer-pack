---
name: config-management-ai-tools
description: >-
  AI-tool surface for the OpenEdge Config Management VS Code extension (package
  `openedge-config-management`, publisher AI4YOU): the central owner of shared OpenEdge ABL
  configuration (db connections, runtime/DLC, project discovery) that all other AI4YOU OpenEdge
  extensions depend on. Covers its 7 language-model tools (scaffold/compile/run/db), the
  `openedge-tooling` MCP server lifecycle, and the `openedge-tooling.*` command IDs. Use when an
  agent must configure OpenEdge projects/connections or scaffold/compile/run ABL.
---

# OpenEdge Config Management — AI tools

Extension: package `openedge-config-management`, publisher `AI4YOU`. Central owner of shared
OpenEdge ABL configuration — the **`openedge.abl`** settings namespace consumed by DataDigger,
Data Administration, HCK, PASOE, and OpenAPI. Also provides ABL scaffolding, compile/run, and an
MCP server.

## AI entry points (in priority order)

1. **Language-model tools** (in chat, `#<reference>`):

| Tool | Reference | Purpose |
|---|---|---|
| Create ABL File | `#openedgeToolingCreateAblFile` | New `.p`/`.cls`/`.i`/`.w` from framework template (`fileType`, `name` required) |
| Init Project Config | `#openedgeToolingInitProjectConfig` | Create `openedge-project.json` with defaults |
| Add Database | `#openedgeToolingDbAdd` | Add a `dbConnections` entry to `openedge-project.json` (`dbName` required) |
| Start All Databases | `#openedgeToolingDbStartAll` | `proserve` every local db from `openedge-project.json` |
| Schema Dump | `#openedgeToolingDumpSchema` | Generate + run an ABL schema dump to `.df` (`dbName`, `dfPath` required) |
| Compile | `#openedgeToolingCompile` | Compile an ABL file; options `XREF`, `DEBUG-LIST`, `LISTING`, `PREPROCESS` |
| Run | `#openedgeToolingRun` | Run an ABL file in `gui` \| `chui` \| `batch` mode |

2. **MCP server** — server key **`openedge-tooling`**, registered via the extension's
   `mcpServerDefinitionProviders` entry (`openedgeConfigManagementProvider`). Lifecycle commands:
   `openedge-tooling.startMcpServer` / `stopMcpServer` / `restartMcpServer` /
   `mcpServerStatus` / `showMcpLogs` / `removeMcpConfigNow`.
3. **VS Code commands** (prefix `openedge-tooling.`) — require a running extension:

| Area | Commands |
|---|---|
| Settings / init | `showSettings`, `initializeProjectConfig`, `resetProjectConfig`, `initializeWorkspaceProjects` |
| New ABL file | `createClass`, `createProcedure`, `createInclude`, `createInterface`, `createEnum`, `createForm`, `createDialog`, `createBusinessEntity`, `createWebHandler`, `createTestCaseClass`, `createTestSuiteClass`, … |
| Source tools | `addMethod`, `addConstructor`, `addDestructor`, `addProcedure`, `addFunction`, `updateFunctionPrototypes`, `toggleLineComment`, `toggleBlockComment` |
| Compile / Run | `compileWithOptions`, `compileWithXref`, `compileWithDebugList`, `compileWithListing`, `compileWithPreprocess`, `runGui`, `runChui`, `runBatch` |
| Analysis | `analyzeComponents`, `createUpdateAssembliesXml` |

## Shared config contract (consumed by the other plugins)

- `openedge.abl.dbConnections[]` — each `{ "connect": "-db mydb -H localhost -S 12345" }`,
  optional friendly `name`. **Single source of truth** for all AI4YOU OpenEdge extensions.
- Runtime settings: DLC path, MCP server workDir/additionalPath
  (`openedge-tooling.mcpServer.*`), project config defaults (`openedge-tooling.projectConfig.*`).
- Legacy `openedge-abl-ui.*` keys are auto-migrated to `openedge-tooling.*`
  (see `configurationMigrations` in `package.json`).

## How an agent should drive it

1. Inspect/maintain connections via `openedge.abl.dbConnections` (settings) or
   `#openedgeToolingDbAdd` (`openedge-project.json`).
2. Scaffold with `#openedgeToolingCreateAblFile`; compile with `#openedgeToolingCompile`;
   run with `#openedgeToolingRun`.
3. For headless agent access, register the `openedge-tooling` MCP server.

## Limitations / readiness

- Language-model tools and commands require a running VS Code extension host; the MCP server is
  the headless path.
- Starting databases and overwriting `openedge-project.json` change shared state — confirm first.
