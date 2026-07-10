---
name: proxy-generator-ai-tools
description: >-
  AI-tool surface for the OpenEdge Proxy Generator VS Code extension (package
  `vscode-openedge-proxy-generator`, publisher AI4YOU): edit ProxyGen (`.pgp`) projects and
  generate Open Client proxies (.NET, Java, Web Services/SOAP, REST) from ABL AppServer
  procedures. Primary agent access is the `openedge-proxy-generator` MCP server (health,
  environment, project/procedure listing, validation, confirmation-gated generation);
  fallbacks are the launcher CLI (`proxyGeneratorLauncherCli.ts start`) and the backend HTTP
  port. Use when an agent must inspect or run OpenEdge proxy generation.
---

# OpenEdge Proxy Generator — AI tools

Extension: package `vscode-openedge-proxy-generator`, publisher `AI4YOU`. Wraps OpenEdge
**ProxyGen** to generate Open Client proxies. Backend is **headless** (Node `index.js`
wrapping `$DLC/bin/proxygenbatch`).

## AI entry points (in priority order)

1. **MCP server** — server key **`openedge-proxy-generator`** (also exposed as
   `languageModelTools` in chat via `#<reference>`). Tools:
   - **Read-only**: `health_check`, `openedge_environment_info`,
     `list_proxygen_projects` (`dir?`), `read_pgp_project` (`path`),
     `validate_pgp_project` (`path`), `list_exposed_procedures` (`dir`).
   - **Generation (writes files)**: `generate_proxies` (`path`) — runs `proxygenbatch`;
     confirm the target `.pgp` and output directory with the user first.
2. **Headless launcher CLI** (no VS Code) — `native/launcher/proxyGeneratorLauncherCli.ts`.
   Command `start`. Args: `--http-port <n>` (default **23015**),
   `--abl-port <n>` (default **23012**). Env: `HTTP_PORT`, `ABL_SOCKET_PORT`, `DLC`.
3. **Backend HTTP API** (default `http://127.0.0.1:23015`):
   - `GET /health`, `GET /api/openedge/environment`
   - `GET /api/projects?dir=`, `GET /api/pgp?path=`, `GET /api/procedures?dir=`
   - `POST /api/pgp/validate` `{ path }`, `POST /api/pgp/save` `{ path, content }`
   - `POST /api/generate` `{ path }`

## Settings

- `proxygen.httpPort` (default 23015), `proxygen.ablSocketPort` (default 23012).
- Requires `DLC` set and `proxygenbatch` present under `$DLC/bin`
  (`/health` and `/api/openedge/environment` report `proxygenAvailable`).

## Safety

`generate_proxies` / `POST /api/generate` runs `proxygenbatch` and writes proxy artifacts
to the project's output directory. Always confirm the project path and output directory
before invoking.
