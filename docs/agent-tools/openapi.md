# OpenEdge ABL – OpenAPI — Agent Tools

**Extension:** [`AI4YOU.openedge-abl-openapi`](https://marketplace.visualstudio.com/items?itemName=AI4YOU.openedge-abl-openapi)
**MCP server:** `@ai4you/openapi-mcp-server` (standalone **stdio** — runs without VS Code)

The OpenAPI extension generates ABL client/server code from OpenAPI
specifications. Its MCP server is **fully headless**: it reads the same
settings from disk, so an agent can list specs and generate code with no UI
running.

## Tools

| Tool | Description | Required args | Optional args |
|---|---|---|---|
| `list_specs` | Scan the workspace for OpenAPI spec files (`.yaml`, `.yml`, `.json`). | — | — |
| `read_spec` | Read and parse an OpenAPI spec; returns the parsed spec as JSON. | `specLocation` | — |
| `list_projects` | List saved code-generation project configurations (keys, generator type, language, spec, path). | — | — |
| `get_project_config` | Full configuration for a saved project, including all `configuredOptions`. | `key` (`{generatorType}\|{language}\|{specLocation}`) | — |
| `generate_code` | Generate OpenEdge ABL code. **Mode A** (saved config): pass only `key`. **Mode B** (new spec): pass `specLocation`, `generatorType` (`client` \| `server`), `language` (`abl` \| `abl-pasoe`), `packageName`, `projectPath`. | Mode A: `key` / Mode B: see description | `openEdgeVersion` (default 12.8), `fileNamingConvention`, `modelPropertyNaming`, `ablApiEnvironment`, `excludeFiles`, `extractToProjectPath`, `additionalOptions` |
| `save_project_config` | Persist a Mode B configuration to VS Code workspace settings for reuse. | `specLocation`, `generatorType`, `language`, `configuredOptions`, `projectPath` | `ablApiEnvironment`, `excludeFiles`, `extractToProjectPath` |

## Recommended agent flow

1. `list_projects` — check whether the spec already has a saved config.
2. `list_specs` → `read_spec` — understand the API.
3. `generate_code` — Mode A with a saved `key`, or Mode B with inline fields.
4. After a successful Mode B generation, offer `save_project_config`.

## Notes

- `save_project_config` writes via `.vscode/mcp-config-bridge.json`, picked up
  by the extension when it runs; generation itself is fully headless.
- Generation is **file-writing**: confirm `projectPath` before generating into
  an existing source tree (`excludeFiles` defaults to `.git,.gitignore`).

---

_Source of truth: the MCP tool schemas in `mcp-server/` of the extension repo. Keep this page in sync when tools change._
