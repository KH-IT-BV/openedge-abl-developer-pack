---
description: Guidance for using the OpenEdge Config Management AI skill
applyTo: "**/*"
---

When working on OpenEdge configuration (database connections, runtime/DLC, project setup), ABL scaffolding, or compile/run tasks, prefer the `config-management-ai-tools` skill for the tool references, `openedge-tooling.*` command IDs, the `openedge-tooling` MCP server, and the shared `openedge.abl.*` settings contract.

Do not invent settings keys, command IDs, tool names, or template/framework names. If details are missing, inspect the skill first.

Configuration is shared by all AI4YOU OpenEdge extensions: treat changes to `openedge.abl.dbConnections` and `openedge-project.json` as workspace-wide; confirm before overwriting existing configuration or starting databases.
