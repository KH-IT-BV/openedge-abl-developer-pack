---
name: pasoe-ai-tools
description: >-
  AI-tool surface for the OpenEdge ABL - PASOE VS Code extension (package `vscode-openedge-pasoe`,
  publisher AI4YOU): manage PASOE servers from VS Code. Command IDs, server-config schema, OAuth
  callback, and the current (UI-coupled) reach model — PASOE management logic is not yet headless.
  Use when an agent must work with PASOE instances or plan headless extraction.
---

# OpenEdge ABL - PASOE — AI tools

Extension: package `vscode-openedge-pasoe`, publisher `AI4YOU`. Configures/manages PASOE (OEPAS)
servers via a Flutter webview. Unlike datadigger/dictionary/hck it has **no Node+OE backend / ABL
socket** — management runs from the extension over HTTP(S) to the PASOE server.

## AI entry points (current)

1. **VS Code commands** (require a running extension):
   - `vscode-openedge.paose.launchOpenEdgePasoe` — open the PASOE configuration UI.
   - `vscode-openedge-pasoe.handleAuth` — OAuth callback handler (`vscode://` URI scheme).
2. **Direct PASOE HTTP(S)** — the management calls target the configured PASOE server
   (`host`/`port`/`transport`). An agent with valid credentials could call PASOE's OE Manager /
   admin endpoints directly, independent of this extension.

## Server config schema (`openedge-pasoe.servers[]`)

Each entry: `name`, `host`, `port`, `transport` (`http`|`https`), `authType` (`basic`|`oauth`),
`username` (default `tomcat`), `password`, `secretKey` (VS Code SecretStorage key for the password).

- Auth: `basic` (username/password) or `oauth` (Auth0-style, via `handleAuth`).
- Passwords may live in **VS Code SecretStorage** (referenced by `secretKey`) — not on disk.

## How an agent should drive it

- Today: human-in-VS-Code via the command, or call the target PASOE server's admin API directly
  with credentials the agent already holds.
- The extension's own management logic is **UI-coupled** — no standalone CLI/MCP yet.

## Limitations / readiness

- No headless CLI or MCP server (planned). Highest-value extraction: PASOE lifecycle
  (status/start/stop) into a `vscode`-free module the agent can call.
- Credential access without VS Code SecretStorage is an open question.
