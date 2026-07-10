---
name: config-management-ai-tools
description: OpenEdge Config Management AI tooling for agents that need to configure OpenEdge ABL projects, manage database connections, scaffold ABL files, compile or run ABL, and use the openedge-tooling MCP server.
---

# OpenEdge Config Management — AI Tools

## Purpose

This skill helps AI agents work with the OpenEdge Config Management VS Code extension.

The extension owns the shared `openedge.abl` configuration namespace used by related OpenEdge tools such as DataDigger, Data Administration, HCK, PASOE tooling, and OpenAPI tooling.

Use this skill when an agent needs to:

- configure an OpenEdge ABL project
- manage database connections
- scaffold ABL files
- compile ABL files
- run ABL files
- start or inspect the `openedge-tooling` MCP server
- understand the shared OpenEdge configuration contract

## Extension identity

- Package: `openedge-config-management`
- Publisher: `AI4YOU`
- Main configuration namespace: `openedge.abl`
- MCP server key: `openedge-tooling`

## AI entry points

### Language-model tools

The extension exposes these language-model tools in compatible VS Code hosts (reference them in chat as `#<reference>`):

| Tool | Reference | Purpose |
|---|---|---|
| Create ABL File | `#openedgeToolingCreateAblFile` | Create a new `.p`, `.cls`, `.i`, or `.w` file from a framework template (`fileType`, `name` required) |
| Init Project Config | `#openedgeToolingInitProjectConfig` | Create an `openedge-project.json` file with sensible defaults |
| Add Database | `#openedgeToolingDbAdd` | Add a database connection to `openedge-project.json` `dbConnections` (`dbName` required) |
| Start All Databases | `#openedgeToolingDbStartAll` | `proserve` every configured local database |
| Schema Dump | `#openedgeToolingDumpSchema` | Generate and run an ABL schema dump to `.df` (`dbName`, `dfPath` required) |
| Compile | `#openedgeToolingCompile` | Compile an ABL source file; options `XREF`, `DEBUG-LIST`, `LISTING`, `PREPROCESS` |
| Run | `#openedgeToolingRun` | Run an ABL source file in `gui`, `chui`, or `batch` mode |

### VS Code commands

Commands use the `openedge-tooling.` prefix and require a running, activated extension host:

| Area | Commands |
|---|---|
| Settings / init | `showSettings`, `initializeProjectConfig`, `resetProjectConfig`, `initializeWorkspaceProjects` |
| New ABL file | `createClass`, `createProcedure`, `createInclude`, `createInterface`, `createEnum`, `createForm`, `createDialog`, `createBusinessEntity`, `createWebHandler`, `createTestCaseClass`, `createTestSuiteClass`, … |
| Source tools | `addMethod`, `addConstructor`, `addDestructor`, `addProcedure`, `addFunction`, `updateFunctionPrototypes`, `toggleLineComment`, `toggleBlockComment` |
| Compile / Run | `compileWithOptions`, `compileWithXref`, `compileWithDebugList`, `compileWithListing`, `compileWithPreprocess`, `runGui`, `runChui`, `runBatch` |
| Analysis | `analyzeComponents`, `createUpdateAssembliesXml` |

## MCP server

The MCP server is the preferred headless integration path for AI agents outside the VS Code extension host.

Server key:

```text
openedge-tooling
```

It is registered through the extension's `mcpServerDefinitionProviders` entry (`openedgeConfigManagementProvider`).

Related VS Code commands:

- `openedge-tooling.startMcpServer`
- `openedge-tooling.stopMcpServer`
- `openedge-tooling.restartMcpServer`
- `openedge-tooling.mcpServerStatus`
- `openedge-tooling.showMcpLogs`
- `openedge-tooling.removeMcpConfigNow`

## Shared configuration contract

The extension is the single source of truth for the shared OpenEdge settings consumed by the other AI4YOU OpenEdge extensions. Settings live under the `openedge.abl` namespace, for example:

```json
{
  "openedge.abl": {
    "dbConnections": [
      { "name": "sports2020", "connect": "-db sports2020 -H localhost -S 12345" }
    ],
    "dlc": "",
    "propath": [],
    "workingDirectory": "",
    "mcp": {}
  }
}
```

Important setting areas:

- **Database connections** — `openedge.abl.dbConnections[]`; each entry is `{ "connect": "-db mydb -H localhost -S 12345" }` with an optional friendly `name`. This is the single source of truth for all AI4YOU OpenEdge extensions.
- **DLC / runtime location** — path to the OpenEdge install.
- **PROPATH** — ABL source/compile search path.
- **Project working directory** — base directory for compile/run.
- **MCP server configuration** — `openedge-tooling.mcpServer.*` (work directory, additional path).
- **Project defaults** — `openedge-tooling.projectConfig.*`.

Legacy `openedge-abl-ui.*` keys are auto-migrated to `openedge-tooling.*` (see `configurationMigrations` in the extension's `package.json`).

## Recommended agent workflow

When helping a user with OpenEdge project setup:

1. Inspect the existing workspace configuration.
2. Check whether `openedge.abl` settings already exist.
3. Add or update database connections using `#openedgeToolingDbAdd` or the shared config.
4. Scaffold missing ABL files using `#openedgeToolingCreateAblFile`.
5. Compile changed ABL files using `#openedgeToolingCompile`.
6. Run files using `#openedgeToolingRun` when appropriate.
7. Use the `openedge-tooling` MCP server for headless or external agent access.

## Constraints

- Language-model tools require a running compatible VS Code extension host.
- VS Code commands require the extension to be installed and activated.
- MCP server access is preferred when the agent is running outside VS Code.
- Do not overwrite existing user configuration without first reading it.
- Do not assume a database can be started unless it is configured as a local database.
- Keep shared configuration compatible with the other OpenEdge Developer Pack extensions.

## Good agent behavior

An agent using this skill should:

- prefer existing workspace configuration over guessing
- make small, explicit configuration changes
- explain which OpenEdge settings were changed
- compile before claiming code is ready
- report errors from ABL compile/run commands clearly
- keep all generated files consistent with the selected OpenEdge framework template
