# openedge-ui-editor-skills

AI-tool skill for the **API4UI - UI Designer & Toolbox** VS Code extension (`AI4YOU.api4ui`).
Teaches an agent how to design/edit OpenEdge ABL `.w` UI and scaffold/compile/run ABL.

## Install

```bash
apm install openedge-ui-editor-skills
# or directly:
apm install KH-IT-BV/openedge-abl-developer-pack/packages/ui-editor#v0.1.0
```

## What the agent gets

API4UI is the only plugin that bundles its own **OpenEdge MCP server** (lifecycle via
`openedge-abl-ui.startMcpServer` / `stopMcpServer` / `restartMcpServer`), plus the headless
`.w` ↔ CraftJS round-trip logic. See `skills/ui-editor-ai-tools/SKILL.md`.
