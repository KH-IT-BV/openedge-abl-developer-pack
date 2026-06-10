# Agent Tools

This section documents the **AI-agent tools** each extension in the OpenEdge ABL
Developer Pack exposes. These are the capabilities an AI agent (Windsurf,
GitHub Copilot, etc.) can call directly to automate OpenEdge work.

Two delivery mechanisms are used across the pack:

- **Language model tools** — declared in an extension's `package.json` under
  `languageModelTools`. In chat you can reference them with `#<toolReferenceName>`
  (e.g. `#queryTable`).
- **MCP servers** — registered via the Model Context Protocol so agents can use
  the same capabilities outside of chat tool references. See each extension's
  page for its MCP server key.

## Per-extension tool reference

| Extension | Tools doc | Status |
|---|---|---|
| [OpenEdge Config Management](config-management.md) | [config-management.md](config-management.md) | Documented/Untested |
| [OpenEdge DataDigger](datadigger.md) | [datadigger.md](datadigger.md) | Documented/Untested |
| [OpenEdge ABL – OpenAPI](openapi.md) | [openapi.md](openapi.md) | Documented/Untested |
| [OpenEdge ABL – PASOE](pasoe.md) | [pasoe.md](pasoe.md) | Documented/Untested |
| [OpenEdge HCK – Health Check Kit](hck.md) | [hck.md](hck.md) | Documented/Untested |
| API4UI – UI Designer & Toolbox | _planned_ | Pending |
| [OpenEdge Data Administration](dictionary.md) | [dictionary.md](dictionary.md) | Documented/Untested |

> Each extension page is kept in sync with its `package.json` tool definitions.
> When tools are added or changed, update the corresponding page here.

## Status legend

Each tool table has a **Status** column tracking validation progress. Every tool
goes through **2 validation rounds**:

| Status              | Meaning                                                  |
| ------------------- | -------------------------------------------------------- |
| 📋 To do            | Not yet tested.                                          |
| 🚧 In progress      | Under test; not working yet (0/2 validations passed).    |
| 🟡 Validation 1/2   | Passed the first validation round; second still pending. |
| ✅ Validation 2/2   | Passed both validation rounds; fully working.            |
