# OpenEdge ABL – PASOE — Agent Tools

**Extension:** [`AI4YOU.vscode-openedge-pasoe`](https://marketplace.visualstudio.com/items?itemName=AI4YOU.vscode-openedge-pasoe)
**MCP server key:** `openedge-pasoe` (provider `pasoeProvider`)

The PASOE extension exposes OE Manager–based PASOE/OEPAS server management to
AI agents: status checks, instance configuration, MS-Agent lifecycle, and PAAR
deployment. In chat, reference a tool with `#<reference>`
(e.g. `#pasoe_status`).

## Read-only tools

| Tool                 | Reference               | Description                                                                                           | Required args | Optional args                                      | Status            |
| -------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------- | ----------------- |
| PASOE Status         | `#pasoe_status`         | Checks a configured PASOE server through OE Manager — running, unreachable, unauthorized, or unknown. | —             | `serverName` (defaults to first configured server) | 🟡 Validation 1/2 |
| List PASOE Instances | `#pasoe_list_instances` | Lists all configured PASOE servers. Passwords are never included.                                     | —             | `includeStatus` (also check live status)           | 🟡 Validation 1/2 |

## State-changing tools

These create configuration or change server state. Confirm the target server
before invoking them.

| Tool               | Reference                   | Description                                                                                                                                         | Required args              | Optional args                                                                                                                                                                                                                                          | Status            |
| ------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| Create Instance    | `#pasoe_create_instance`    | Provisions a PASOE instance on the local machine via `pasman create` (requires local OpenEdge/DLC). Can deploy OE Manager and register it in VS Code. | `name`, `basePath`         | `instanceAlias`, `ablAppName`, `httpPort`, `httpsPort`, `shutdownPort`, `ajpPort`, `securityMode` (dev\|prod), `managerUser`, `managerPassword`, `copyWars`, `deployOeManager`, `bypassPortValidation`, `ownerUser`, `ownerGroup`, `registerInVscode`, `provisionInstance`, `overwrite`, `elevate` | 🟡 Validation 1/2 |
| Delete Instance    | `#pasoe_delete_instance`    | Deletes a local PASOE instance via `pasman delete <instanceDir>` (inverse of create). Idempotent (already-absent = success); optionally deregisters the VS Code entry. Local-only. | `instancePath`             | `name`, `deregisterFromVscode`, `elevate`                                                                                                                                                                                                              | 🚧 In progress    |
| Start MS-Agent     | `#pasoe_start_agent`        | Starts an OE Manager MS-Agent for an application (`addAgent` endpoint).                                                                            | `appName`                  | `serverName`, `timeoutMs`                                                                                                                                                                                                                              | 🟡 Validation 1/2 |
| Stop MS-Agent      | `#pasoe_stop_agent`         | Stops an OE Manager MS-Agent (agents DELETE endpoint).                                                                                            | `appName`, `agentId`       | `serverName`, `waitToFinish`, `waitAfterStop`, `timeoutMs`                                                                                                                                                                                             | 🟡 Validation 1/2 |
| Start Server       | `#pasoe_start_server`       | Starts the local PASOE server (Tomcat + OE Manager) for a created instance via `tcman pasoestart`. Local-only; brings the server up so `pasoe_status` reports running. | `instancePath`             | `name`                                                                                                                                                                                                                                                 | 🚧 In progress    |
| Stop Server        | `#pasoe_stop_server`        | Stops the local PASOE server (Tomcat + OE Manager) for a created instance via `tcman pasoestart -halt` (OpenEdge's graceful stop; there is no `pasoestop`). Local-only. | `instancePath`             | `name`                                                                                                                                                                                                                                                 | 🚧 In progress    |
| Deploy Application | `#pasoe_deploy_application` | Deploys a `.paar` archive to a web app via OE Manager REST/SOAP/WEB transport.                                                                    | `appName`, `webAppName`, `transport` (rest\|soap\|web), `archivePath` | `serverName`, `timeoutMs`                                                                                                                                                                                                                              | 🚧 In progress    |

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
