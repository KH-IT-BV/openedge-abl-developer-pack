# openedge-database-selector-skills

AI-tool skill for the **Database Selector** shared library (`KH-IT-BV/vscode-database-selector`).
It is a foundation library reused by DataDigger, Dictionary, and HCK — not a standalone extension.

## Install

```bash
apm install openedge-database-selector-skills
# or directly:
apm install KH-IT-BV/openedge-abl-developer-pack/packages/database-selector#v0.1.0
```

## What the agent gets

The shared connection contract `openedge.abl.dbConnections[]` (and `--connectionsFilePath`) that
the agent supplies to the other plugins' tools. See `skills/database-selector-ai-tools/SKILL.md`.
