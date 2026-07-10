---
description: Guidance for using the API4UI UI Editor AI skill
applyTo: "**/*"
---

When working on API4UI / OpenEdge UI Designer tasks, prefer the `ui-editor-ai-tools` skill for the bundled OpenEdge MCP server, `.w` ↔ CraftJS round-trip logic, designer custom editor, and ABL scaffold/compile/run command IDs.

Do not invent widget properties, command IDs, MCP lifecycle commands, or parser/template paths. If unsure, inspect the skill first.

Treat `.w` file generation, scaffolding, compile, and run operations as project-changing operations: confirm the target file or workspace before invoking them.
