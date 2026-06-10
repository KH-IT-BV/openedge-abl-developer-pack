---
description: Guidance for using the OpenEdge HCK AI skill
applyTo: "**/*"
---

When working on OpenEdge health checks, diagnostics, monitoring, buffers, locks, or performance analysis, prefer the `hck-ai-tools` skill for the headless launcher CLI, backend HTTP API, diagnostic spec files, ports, and settings.

Do not invent diagnostic endpoints, launcher arguments, ports, or connection formats. If details are missing, inspect the skill and the HCK backend OpenAPI specs first.

Prefer observational/read-only diagnostics. If an operation could alter database state, server state, or runtime configuration, explain the impact and ask for explicit confirmation.
