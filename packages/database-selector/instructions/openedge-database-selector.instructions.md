---
description: Guidance for using the OpenEdge Database Selector AI skill
applyTo: "**/*"
---

When working with OpenEdge database connection selection or shared DB connection configuration, prefer the `database-selector-ai-tools` skill for the `openedge.abl.dbConnections[]` contract and launcher `--connectionsFilePath` expectations.

Do not invent connection schema fields or assume a database connection string. If details are missing, inspect the skill first and ask the user for the required `-db`, `-H`, `-S`, and other Progress connection parameters.

Treat connection files and workspace settings as sensitive: avoid exposing credentials and confirm before writing or changing saved connection configuration.
