---
name: openapi-ai-tools
description: >-
  AI-tool surface for the OpenEdge ABL - OpenAPI VS Code extension (package `openedge-abl-openapi`,
  publisher AI4YOU): generate ABL client/server code from OpenAPI specs. The reference AI
  integration — ships a standalone stdio MCP server that runs WITHOUT VS Code. Covers the MCP
  tools, the two generate modes, env-var config, and command IDs. Use when an agent must list/read
  specs or generate ABL/PASOE code from OpenAPI.
---

# OpenEdge ABL - OpenAPI — AI tools

Extension: package `openedge-abl-openapi`, publisher `AI4YOU`. Generates ABL client/server code
from OpenAPI specs via the AI4YOU / `openapi-generator-rust` engine. **The reference AI surface
for the whole product line** — its MCP server is standalone and does not require VS Code.

## AI entry point: bundled stdio MCP server (`mcp-server/`)

npm package `@ai4you/openapi-mcp-server`, transport **stdio**. It reads the same VS Code settings
from disk, so an agent can list and generate with no UI running. Tools:

| Tool | Purpose |
|---|---|
| `list_projects` | saved project generation configs |
| `get_project_config` | one saved config by `key` |
| `list_specs` | OpenAPI spec files in the workspace |
| `read_spec` | read & parse a spec |
| `generate_code` | generate — **Mode A** (`key` of a saved config) or **Mode B** (inline) |
| `save_project_config` | persist a Mode-B config for reuse (written via file bridge) |

**Mode B (inline) required fields:** `specLocation`, `generatorType` (`client`|`server`),
`language`, `packageName`, `projectPath`. Optional: `ablApiEnvironment`, `openEdgeVersion`
(default `12.8`), `fileNamingConvention` (default `pascal`), `modelPropertyNaming` (default
`pascal`), `extractToProjectPath`, `excludeFiles`, `additionalOptions`.

## Config (env vars + settings)

- Env: `OPENAPI_PROJECT_SETTINGS`, `OPENAPI_WORKSPACE_PATH`, `OPENAPI_DEFAULT_ENVIRONMENT`.
- Settings key: `ai4you-openapi.projectGenerationSettings` in `.vscode/settings.json`
  (per-project configs keyed `{generatorType}|{language}|{specLocation}`).
- ABL API environments: `development`=`http://localhost:3000`;
  `2025q3`/`2025q4`/`2026q1`=`https://{env}.apir.openapi.api4ui.io` (default `2026q1`).

## VS Code commands (human-in-VS-Code)

- `vscode-openapi.launchAI4YOUOpenAPI` — open the generator UI.
- `vscode-openapi.handleAuth` — Auth0 OAuth callback (`vscode-openapi://`).

## How an agent should drive it

1. Register `@ai4you/openapi-mcp-server` (stdio) with the env vars above pointing at the workspace.
2. `list_specs` → `read_spec` to understand the API.
3. `generate_code` Mode A (saved `key`) or Mode B (inline fields). Offer `save_project_config` after.

## Limitations / readiness

- `save_project_config` writes via `.vscode/mcp-config-bridge.json`, picked up by the extension
  when running (bridge path). Generation itself is fully headless.
- Keep extension settings, MCP tool schemas, and `openapi-generator-rust` options in sync.
