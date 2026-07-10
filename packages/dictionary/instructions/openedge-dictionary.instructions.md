---
description: Guidance for using the OpenEdge Data Administration AI skill
applyTo: "**/*"
---

When working on OpenEdge schema, dictionary, dump/load, or database administration tasks, prefer the `dictionary-ai-tools` skill for the `openedge-dictionary` MCP tools, launcher CLI, backend HTTP API, command IDs, ports, and settings.

Do not invent schema endpoints, command IDs, launcher arguments, report names, or connection formats. If unsure, inspect the skill first.

Treat load, dump, DB ID maintenance, schema changes, and other administration operations as potentially destructive: explain the impact and ask for explicit confirmation before running them.
