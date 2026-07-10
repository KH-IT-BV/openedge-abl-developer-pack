# openedge-pasoe-skills

AI-tool skill for the **OpenEdge ABL - PASOE** VS Code extension
(`AI4YOU.vscode-openedge-pasoe`). Teaches an agent how to work with PASOE/OEPAS servers.

## Install

```bash
apm install openedge-pasoe-skills
# or directly:
apm install KH-IT-BV/openedge-abl-developer-pack/packages/pasoe#v0.2.0
```

## What the agent gets

The **PASOE MCP server / language-model tools** (`pasoe_status`, `pasoe_list_instances`,
`pasoe_create_instance`, `pasoe_start_instance`, `pasoe_stop_instance`,
`pasoe_deploy_application` — OE Manager-based), plus command IDs, the `openedge-pasoe.servers[]`
config schema, and the OAuth callback. See `skills/pasoe-ai-tools/SKILL.md`.
