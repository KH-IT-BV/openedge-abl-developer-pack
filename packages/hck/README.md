# openedge-hck-skills

AI-tool skill for the **OpenEdge HCK - Health Check Kit** VS Code extension
(`AI4YOU.vscode-openedge-hck`). Teaches an agent how to run health checks and read diagnostics.

## Install

```bash
apm install openedge-hck-skills
# or directly:
apm install KH-IT-BV/openedge-abl-developer-pack/packages/hck#v0.1.0
```

## What the agent gets

A headless Node+OE backend reachable without VS Code via the launcher CLI
(`hckLauncherCli.ts start`, httpPort 23003 / ablSocketPort 23000) and the backend HTTP API
described by `hck_backend/openApiSpecs/ds*Spec.yaml` (one per diagnostic area).
See `skills/hck-ai-tools/SKILL.md`.
