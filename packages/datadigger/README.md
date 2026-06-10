# openedge-datadigger-skills

AI-tool skill for the **OpenEdge DataDigger** VS Code extension
(`AI4YOU.vscode-openedge-datadigger`). Teaches an agent how to browse/query OpenEdge tables.

## Install

```bash
apm install openedge-datadigger-skills
# or directly:
apm install KH-IT-BV/openedge-abl-developer-pack/packages/datadigger#v0.2.0
```

## What the agent gets

The **`openedge-datadigger` MCP server** (10 tools: list/describe/query/count + confirmation-gated
row writes and export), plus a headless Node+OE backend reachable without VS Code via the launcher
CLI (`datadiggerLauncherCli.ts start`, httpPort 23004 / ablSocketPort 23001) and the backend HTTP
API. See `skills/datadigger-ai-tools/SKILL.md`.
