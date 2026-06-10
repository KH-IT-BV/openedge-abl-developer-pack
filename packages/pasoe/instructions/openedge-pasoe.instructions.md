---
description: Guidance for using the OpenEdge PASOE AI skill
applyTo: "**/*"
---

When working on PASOE/OEPAS management tasks, prefer the `pasoe-ai-tools` skill for the PASOE MCP tools (status, instance config, MS-Agent lifecycle, PAAR deployment), command IDs, `openedge-pasoe.servers[]` schema, and authentication details.

Do not invent PASOE command IDs, server config fields, authentication flows, or admin endpoints. If details are missing, inspect the skill first.

Treat start/stop/restart, deployment, configuration, credential handling, and direct PASOE admin API calls as sensitive operations: confirm the target server and ask for explicit confirmation before changing state.
