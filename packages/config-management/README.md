# openedge-config-management-skills

AI-tool skill for the **OpenEdge Config Management** VS Code extension
(`AI4YOU.openedge-config-management`). Teaches an agent the shared OpenEdge
configuration contract and the ABL scaffolding/compile/run tool surface.

## Install

```bash
apm install openedge-config-management-skills
# or directly:
apm install KH-IT-BV/openedge-abl-developer-pack/packages/config-management#v0.2.0
```

## What the agent gets

The shared `openedge.abl.*` configuration contract (db connections, runtime/DLC)
consumed by all AI4YOU OpenEdge extensions, 7 language-model tools (create ABL
file, init project config, db add/start-all, schema dump, compile, run), the
`openedge-tooling` MCP server lifecycle, and the `openedge-tooling.*` command
groups. See `skills/config-management-ai-tools/SKILL.md`.
