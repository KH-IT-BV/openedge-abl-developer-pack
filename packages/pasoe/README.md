# openedge-pasoe-skills

AI-tool skill for the **OpenEdge ABL - PASOE** VS Code extension
(`AI4YOU.vscode-openedge-pasoe`). Teaches an agent how to work with PASOE/OEPAS servers.

## Install

```bash
apm install openedge-pasoe-skills
# or directly:
apm install KH-IT-BV/openedge-abl-developer-pack/packages/pasoe#v0.1.0
```

## What the agent gets

Command IDs, the `openedge-pasoe.servers[]` config schema, and the OAuth callback. Note: PASOE
management is **UI-coupled** today — no headless CLI/MCP yet (an agent with credentials can call
the PASOE admin API directly). See `skills/pasoe-ai-tools/SKILL.md`.
