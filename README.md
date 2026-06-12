# OEDP – OpenEdge ABL Developer Pack

![Status: work in progress](https://img.shields.io/badge/status-work_in_progress-orange)

> **Early access / work in progress.** The extensions are usable today. the **AI-skills + MCP** layer is actively being built and tested.

> A curated VS Code extension pack for **Progress OpenEdge ABL / 4GL** developers — language support, snippets, tooling, and productivity extensions in one install.

![OpenEdge ABL Developer Pack](https://raw.githubusercontent.com/KH-IT-BV/openedge-abl-developer-pack/main/images/banner.png)

---

## Why this pack exists

It's mid-2026. Almost everyone is writing software either by hand or side-by-side
with AI — and the pace is accelerating fast. The teams at the front of the curve
have already moved past "AI autocomplete." They're **orchestrating** their work:
describing issues, and letting humans and agents drive them to done together.

![From manual coding to AI orchestration — four stages](https://raw.githubusercontent.com/KH-IT-BV/openedge-abl-developer-pack/main/images/stages.png)

In the OpenEdge world, that next step is still hard. Not because the language
can't keep up, but because **not all the tools are there yet** to fully automate
the workflow. Too much of the day still depends on manual, screen-by-screen work.

That's where we step in.

The tooling itself isn't missing — it just isn't available in VS Code and its
forks yet. That's where **phase 1** starts: bringing it into this environment.

| Capability                       | Extension                       | Available on                                                                                                                                                                                                                                                                                                                                                | Ongoing                                                                        |
| -------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Database administration**      | OpenEdge Data Administration    | ![VS Code](https://img.shields.io/badge/VS_Code-007ACC?logo=visualstudiocode&logoColor=white) ![Open VSX](https://img.shields.io/badge/Open_VSX-A60EE5?logo=eclipseide&logoColor=white) ![Windows](https://img.shields.io/badge/Windows-0078D6?logo=windows&logoColor=white) ![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black) | ![MCP](https://img.shields.io/badge/MCP-000000?logo=anthropic&logoColor=white) |
| **UI design**                    | API4UI – UI Designer & Toolbox  | ![VS Code](https://img.shields.io/badge/VS_Code-007ACC?logo=visualstudiocode&logoColor=white) ![Open VSX](https://img.shields.io/badge/Open_VSX-A60EE5?logo=eclipseide&logoColor=white)                                                                                                                                                                     | ![MCP](https://img.shields.io/badge/MCP-000000?logo=anthropic&logoColor=white) |
| **PASOE management**             | OpenEdge ABL – PASOE            | ![VS Code](https://img.shields.io/badge/VS_Code-007ACC?logo=visualstudiocode&logoColor=white) ![Open VSX](https://img.shields.io/badge/Open_VSX-A60EE5?logo=eclipseide&logoColor=white) ![Windows](https://img.shields.io/badge/Windows-0078D6?logo=windows&logoColor=white) ![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black) | ![MCP](https://img.shields.io/badge/MCP-000000?logo=anthropic&logoColor=white) |
| **API code generation**          | OpenEdge ABL – OpenAPI          | ![VS Code](https://img.shields.io/badge/VS_Code-007ACC?logo=visualstudiocode&logoColor=white) ![Open VSX](https://img.shields.io/badge/Open_VSX-A60EE5?logo=eclipseide&logoColor=white)                                                                                                                                                                     | ![MCP](https://img.shields.io/badge/MCP-000000?logo=anthropic&logoColor=white) |
| **Database querying & browsing** | OpenEdge DataDigger             | ![VS Code](https://img.shields.io/badge/VS_Code-007ACC?logo=visualstudiocode&logoColor=white) ![Open VSX](https://img.shields.io/badge/Open_VSX-A60EE5?logo=eclipseide&logoColor=white) ![Windows](https://img.shields.io/badge/Windows-0078D6?logo=windows&logoColor=white) ![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black) | ![MCP](https://img.shields.io/badge/MCP-000000?logo=anthropic&logoColor=white) |
| **Performance checks**           | OpenEdge HCK – Health Check Kit | ![VS Code](https://img.shields.io/badge/VS_Code-007ACC?logo=visualstudiocode&logoColor=white) ![Open VSX](https://img.shields.io/badge/Open_VSX-A60EE5?logo=eclipseide&logoColor=white) ![Windows](https://img.shields.io/badge/Windows-0078D6?logo=windows&logoColor=white) ![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black) | ![MCP](https://img.shields.io/badge/MCP-000000?logo=anthropic&logoColor=white) |
| **Shared configuration**         | OpenEdge Config Management      | ![VS Code](https://img.shields.io/badge/VS_Code-007ACC?logo=visualstudiocode&logoColor=white) ![Open VSX](https://img.shields.io/badge/Open_VSX-A60EE5?logo=eclipseide&logoColor=white)                                                                                                                                                                     | ![MCP](https://img.shields.io/badge/MCP-000000?logo=anthropic&logoColor=white) |

> MCP badges reflect extensions with documented agent tools others are planned.

Today, these tools live mainly **in the UI, during development**.
The second stage brings them to developers **working manually with AI agents**
inside VS Code and its forks, through the extensions in this pack.

But that's not the destination. The goal is to move **away from the code itself**
and toward a **project-management foundation** — where humans and AI collaborate
on _described features_, not lines of code. To get there, the OpenEdge ecosystem
still has gaps we need to close.

By bringing these tools to VS Code and its forks now, we make their capabilities
**available to agents** — and that unlocks **stable, predictable, fully automated
feature delivery** for OpenEdge development.

> **Work in progress:** We are also building installable AI-agent skills for this pack using Microsoft APM. See [AI skills for agents (APM) — work in progress](AI-SKILLS-APM-WIP.md).

> **Agent tools:** For the tools each extension exposes to AI agents, see [Agent Tools](docs/agent-tools/README.md) — covering [DataDigger](docs/agent-tools/datadigger.md), [Data Administration](docs/agent-tools/dictionary.md), [HCK](docs/agent-tools/hck.md), [PASOE](docs/agent-tools/pasoe.md), [OpenAPI](docs/agent-tools/openapi.md), and [Config Management](docs/agent-tools/config-management.md).

---

## What's inside

### Foundation

| Extension                                                                                                    | What it does                                                                            |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [OpenEdge ABL (LSP)](https://marketplace.visualstudio.com/items?itemName=riversidesoftware.openedge-abl-lsp) | The base language server: syntax, compile, navigation. Most of the pack builds on this. |

### OpenEdge tooling by AI4YOU

| Extension                                                                                                                      | What it does                                                                                                                                                                                                       | Documentation                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| [OpenEdge Config Management](https://marketplace.visualstudio.com/items?itemName=AI4YOU.openedge-config-management)            | Central owner of shared OpenEdge ABL configuration (database connections, runtime/DLC, project discovery) — plus ABL scaffolding, compile/run, and MCP server lifecycle. The other AI4YOU extensions depend on it. | Coming Soon                                                                                           |
| [API4UI – UI Designer & Toolbox](https://marketplace.visualstudio.com/items?itemName=AI4YOU.api4ui)                            | Visual drag-and-drop UI designer for OpenEdge ABL.                                                                                                                                                                 | Coming Soon                                                                                           |
| [OpenEdge ABL – OpenAPI](https://marketplace.visualstudio.com/items?itemName=AI4YOU.openedge-abl-openapi)                      | Generate and keep ABL clients aligned with OpenAPI specs.                                                                                                                                                          | Coming Soon                                                                                           |
| [OpenEdge ABL – PASOE](https://marketplace.visualstudio.com/items?itemName=AI4YOU.vscode-openedge-pasoe)                       | Configure and manage PASOE servers from a graphical interface.                                                                                                                                                     | [PASOE Documentation](https://releases.rm-worx.be/manuals/pasoe-documentation)                        |
| [OpenEdge DataDigger](https://marketplace.visualstudio.com/items?itemName=AI4YOU.vscode-openedge-datadigger)                   | Database browser and data editor.                                                                                                                                                                                  | [Datadigger Documentation](https://releases.rm-worx.be/manuals/datadigger-documentation)              |
| [OpenEdge Data Administration](https://marketplace.visualstudio.com/items?itemName=AI4YOU.vscode-openedge-data-administration) | Database administration tooling.                                                                                                                                                                                   | [Data Administration Documentation](https://releases.rm-worx.be/manuals/administration-documentation) |
| [OpenEdge HCK – Health Check Kit](https://marketplace.visualstudio.com/items?itemName=AI4YOU.vscode-openedge-hck)              | Database health-check monitoring and analysis dashboard.                                                                                                                                                           | [HCK Documentation](https://releases.rm-worx.be/manuals/hck-documentation)                            |

### AI & automation

| Extension                                                                                                                                    | What it does                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [Progress OpenEdge MCP Connector](https://marketplace.visualstudio.com/items?itemName=progress-software.progress-openedge-mcp-connector-abl) | Official Progress MCP connector for ABL — exposes OpenEdge to AI agents. |

### Extra developer tools

| Extension                                                                                   | What it does                                       |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [ProPeek](https://marketplace.visualstudio.com/items?itemName=balticamadeus.pro-peek)       | Extra OpenEdge inspection tooling.                 |
| [ABLUnit Runner](https://marketplace.visualstudio.com/items?itemName=wayfare.ablunitrunner) | Run ABLUnit tests. _(VS Code only.)_               |
| [Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens)      | Inline diagnostics, highlighted right on the line. |

---

## Installation

1. Open **Extensions** (`Ctrl+Shift+X`).
2. Search for **OpenEdge ABL Developer Pack**.
3. Click **Install** — all bundled extensions install together.

> **Note:** _ABLUnit Runner_ is available on VS Code only and may not install on every VS Code fork.

---

## Compatibility

Works in VS Code `^1.96.0` and compatible forks. Individual extensions may have
their own platform requirements.

---

## About

The **AI4YOU** extensions in this pack are built and published by **KH-IT BV**.
`AI4YOU` is our VS Code Marketplace publisher name; **KH-IT** is the company behind it.

---

_OEDP is the short brand name. The Marketplace display name is **OpenEdge ABL Developer Pack** for discoverability._
