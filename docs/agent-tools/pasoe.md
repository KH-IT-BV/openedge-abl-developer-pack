# OpenEdge ABL – PASOE — Agent Tools

**Extension:** [`AI4YOU.vscode-openedge-pasoe`](https://marketplace.visualstudio.com/items?itemName=AI4YOU.vscode-openedge-pasoe)
**MCP server key:** `openedge-pasoe` (provider `pasoeProvider`)

The PASOE extension exposes OE Manager–based PASOE/OEPAS server management to
AI agents: status checks, instance configuration, MS-Agent lifecycle, and PAAR
deployment. In chat, reference a tool with `#<reference>`
(e.g. `#pasoe_status`).

## Read-only tools

| Tool | Reference | Description | Required args | Optional args |
|---|---|---|---|---|
| PASOE Status | `#pasoe_status` | Checks a configured PASOE server through OE Manager — running, unreachable, unauthorized, or unknown. | — | `serverName` (defaults to first configured server) |
| List PASOE Instances | `#pasoe_list_instances` | Lists all configured PASOE servers. Passwords are never included. | — | `includeStatus` (also check live status) |

## State-changing tools

These create configuration or change server state. Confirm the target server
before invoking them.

| Tool | Reference | Description | Required args | Optional args |
|---|---|---|---|---|
| Create Instance Configuration | `#pasoe_create_instance` | Creates/updates a PASOE server entry in settings + SecretStorage. Config only — does **not** create an OS-level PASOE runtime. | `name`, `host` | `port` (default 8810), `transport` (`http` \| `https`), `authType` (`basic` \| `oauth`), `username`, `password`, `sharePlaintextCredentials`, `overwrite` |
| Start MS-Agent | `#pasoe_start_instance` | Starts an OE Manager MS-Agent for an application (`addAgent` endpoint). | `appName` | `serverName`, `timeoutMs` |
| Stop MS-Agent | `#pasoe_stop_instance` | Stops an OE Manager MS-Agent (agents DELETE endpoint). | `appName`, `agentId` | `serverName`, `waitToFinish`, `waitAfterStop`, `timeoutMs` |
| Deploy Application | `#pasoe_deploy_application` | Deploys a `.paar` archive to a web app via OE Manager REST/SOAP/WEB transport. | `appName`, `webAppName`, `transport` (`rest` \| `soap` \| `web`), `archivePath` | `serverName`, `timeoutMs` |

## Argument notes

- **`serverName`** — name of a configured server from `openedge-pasoe.servers[]`;
  when omitted, the first configured server is used.
- **`appName` / `webAppName`** — OE Manager application / web application names.
- **Credentials** — passwords live in VS Code SecretStorage (referenced by
  `secretKey`) unless `sharePlaintextCredentials` is set. The MCP server cannot
  read SecretStorage outside VS Code — pass credentials explicitly when running
  headless.

## Server configuration (`openedge-pasoe.servers[]`)

Each entry: `name`, `host`, `port`, `transport` (`http`|`https`), `authType`
(`basic`|`oauth`), `username` (default `tomcat`), `password`, `secretKey`.

---

_Source of truth: `languageModelTools` in the extension's `package.json`. Keep this page in sync when tools change._
