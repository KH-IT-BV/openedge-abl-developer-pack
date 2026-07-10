# openedge-dictionary-skills

AI-tool skill for the **OpenEdge Data Administration** (Dictionary) VS Code extension
(`AI4YOU.vscode-openedge-data-administration`). Teaches an agent how to inspect/administer schema.

## Install

```bash
apm install openedge-dictionary-skills
# or directly:
apm install KH-IT-BV/openedge-abl-developer-pack/packages/dictionary#v0.2.0
```

## What the agent gets

The **`openedge-dictionary` MCP server** (~50 tools: schema reads, reports, dump/load,
confirmation-gated schema edits, DB lifecycle/ops, environment/process inspection), plus a
headless Node+OE backend reachable without VS Code via the launcher CLI
(`dictionaryLauncherCli.ts start`, httpPort 23005 / ablSocketPort 23002) and the backend HTTP API.
See `skills/dictionary-ai-tools/SKILL.md`.
