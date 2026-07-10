# openedge-openapi-skills

AI-tool skill for the **OpenEdge ABL - OpenAPI** VS Code extension (`AI4YOU.openedge-abl-openapi`).
Teaches an agent how to generate ABL client/server code from OpenAPI specs.

## Install

```bash
apm install openedge-openapi-skills              # via the pack marketplace
# or directly:
apm install KH-IT-BV/openedge-abl-developer-pack/packages/openapi#v0.1.0
```

## What the agent gets

The standalone stdio MCP server (`@ai4you/openapi-mcp-server`) runs **without VS Code**. Tools:
`list_projects`, `get_project_config`, `list_specs`, `read_spec`, `generate_code`,
`save_project_config`. See `skills/openapi-ai-tools/SKILL.md` for the full surface.
