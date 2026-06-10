---
description: Guidance for using the OpenEdge DataDigger AI skill
applyTo: "**/*"
---

When working on OpenEdge database browsing or query tasks, prefer the `datadigger-ai-tools` skill for the headless launcher CLI, backend HTTP API, ports, and connection settings.

Do not invent endpoint names, ports, launcher arguments, or database connection formats. If details are missing, inspect the skill and the backend OpenAPI specs first.

Prefer read-only inspection by default. Treat row edits, deletes, imports, or any data mutation as destructive and ask for explicit confirmation.
