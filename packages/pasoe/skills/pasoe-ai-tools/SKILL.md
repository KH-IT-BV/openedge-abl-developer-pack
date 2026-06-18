---
name: pasoe-ai-tools
description: >-
  AI-tool surface for the OpenEdge ABL - PASOE VS Code extension (package `vscode-openedge-pasoe`,
  publisher AI4YOU): manage PASOE servers from VS Code. Primary agent access is the
  `openedge-pasoe` MCP server / language-model tools (status, list/create instance config,
  MS-Agent start/stop, PAAR deployment via OE Manager); plus command IDs, the server-config
  schema, and the OAuth callback. Use when an agent must work with PASOE instances.
---

# OpenEdge ABL - PASOE — AI tools

Extension: package `vscode-openedge-pasoe`, publisher `AI4YOU`. Configures/manages PASOE (OEPAS)
servers via a Flutter webview. Unlike datadigger/dictionary/hck it has **no Node+OE backend / ABL
socket** — management runs from the extension over HTTP(S) to the PASOE server.

## AI entry points (in priority order)

1. **MCP server / language-model tools** — provider `pasoeProvider` (`pasoe_mcp_server/`), tools
   also referenceable in chat (e.g. `#pasoe_status`). All target a configured server
   (`serverName`, defaults to the first entry):
   - Read-only: `pasoe_status` (running/unreachable/unauthorized), `pasoe_list_instances`
     (optionally with live status; passwords never included).
   - State-changing: `pasoe_create_instance` (provisions a local OS-level PASOE instance via
     `pasman` and registers it in `openedge-pasoe.servers`), `pasoe_start_instance` /
     `pasoe_stop_instance` (OE Manager MS-Agent lifecycle per `appName`/`agentId`),
     `pasoe_deploy_application` (deploy a `.paar` to a web app via `rest` | `soap` | `web` transport).
2. **VS Code commands** (require a running extension):
   - `vscode-openedge.paose.launchOpenEdgePasoe` — open the PASOE configuration UI.
   - `vscode-openedge-pasoe.handleAuth` — OAuth callback handler (`vscode://` URI scheme).
3. **Direct PASOE HTTP(S)** — the management calls target the configured PASOE server
   (`host`/`port`/`transport`). An agent with valid credentials can call PASOE's OE Manager /
   admin endpoints directly, independent of this extension.

## Server config schema (`openedge-pasoe.servers[]`)

Each entry: `name`, `host`, `port`, `transport` (`http`|`https`), `authType` (`basic`|`oauth`),
`username` (default `tomcat`), `password`, `secretKey` (VS Code SecretStorage key for the password).

- Auth: `basic` (username/password) or `oauth` (Auth0-style, via `handleAuth`).
- Passwords may live in **VS Code SecretStorage** (referenced by `secretKey`) — not on disk.

## How an agent should drive it

1. `pasoe_list_instances` (with `includeStatus`) to see configured servers.
2. `pasoe_status` before/after any change. 3. Use `pasoe_start_instance` / `pasoe_stop_instance`
   / `pasoe_deploy_application` for lifecycle and deployment — confirm the target server first.
- Fallback: call the PASOE server's OE Manager API directly with credentials the agent holds.

## Limitations / readiness

- `pasoe_create_instance` provisions a local OS-level PASOE instance via `pasman` and registers it
  in `openedge-pasoe.servers`. The instance is created on disk but **not** started automatically.
- Registered PASOE instances must **not** be deleted manually (do not delete the instance directory
  or edit `openedge-pasoe.servers` by hand). Deletion must go through the PASOE MCP server / pasman
  so configuration and the OS-level instance stay in sync.
- Passwords live in VS Code SecretStorage (via `secretKey`); outside VS Code, credentials must be
  provided explicitly. Treat start/stop/deploy as state-changing — confirm the target.
