---
description: Guidance for using the OpenEdge OpenAPI AI skill
applyTo: "**/*"
---

When working on OpenEdge ABL - OpenAPI generation tasks, prefer the `openapi-ai-tools` skill for the detailed MCP tools, command IDs, settings keys, and generation modes.

Do not invent MCP tool names, VS Code command IDs, environment variables, generator options, package names, or output paths. If details are missing, inspect the skill first.

Treat `generate_code` and project config saves as filesystem-changing operations: confirm the target workspace, `projectPath`, `specLocation`, and generator mode before running them.
