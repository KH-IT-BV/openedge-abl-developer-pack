# AI skills for agents (APM) — work in progress

> **Status:** Work in progress. We are actively building and testing these APM packages. The structure is available for early validation, but the agent skills and MCP integrations are not fully complete yet.

Beyond the extensions, this repo also ships **AI-tool skills** — instructions that teach an AI agent how to *drive* each plugin (via its MCP server, headless launcher CLI/HTTP backend, or commands). They are distributed with the [Agent Package Manager (APM)](https://microsoft.github.io/apm/).

One installable package per plugin lives under `packages/`:

| Package | Plugin |
|---|---|
| `openedge-openapi-skills` | OpenEdge ABL – OpenAPI |
| `openedge-ui-editor-skills` | API4UI – UI Designer & Toolbox |
| `openedge-datadigger-skills` | OpenEdge DataDigger |
| `openedge-dictionary-skills` | OpenEdge Data Administration |
| `openedge-hck-skills` | OpenEdge HCK – Health Check Kit |
| `openedge-pasoe-skills` | OpenEdge ABL – PASOE |
| `openedge-database-selector-skills` | Database Selector (shared) |
| `openedge-config-management-skills` | OpenEdge Config Management (shared config owner) |

Each package uses the **plugin layout** (discoverable, non-hidden paths) and contains:

- **`instructions/*.instructions.md`** — short always-on guidance for the agent.
- **`skills/*/SKILL.md`** — detailed on-demand skill documentation for the plugin tool surface.
- **`.claude-plugin/plugin.json`** — plugin manifest synthesized by `apm pack` (gitignored).

## Use the skills

First install APM (Agent Package Manager). See the official quickstart:
https://microsoft.github.io/apm/quickstart/

```powershell
# Windows PowerShell
irm https://aka.ms/apm-windows | iex

# Verify installation
apm --version
```

On macOS / Linux:

```bash
curl -sSL https://aka.ms/apm-unix | sh
apm --version
```

If `apm` is still not recognized after installation, restart the terminal so the updated `PATH` is loaded.

```bash
# Add this repo as an APM marketplace, then install any subset:
apm marketplace add KH-IT-BV/openedge-abl-developer-pack
apm install openedge-openapi-skills

# …or install one plugin package directly by subpath + tag:
apm install KH-IT-BV/openedge-abl-developer-pack/packages/openapi#v0.2.0
```

## Source of truth

**This repo (`packages/*`) is the single source of truth for the skill packages.**
The `KH-IT-BV/skills` repo must consume them via the APM marketplace
(`apm marketplace add KH-IT-BV/openedge-abl-developer-pack`) instead of keeping
its own copies — any duplicated `*-ai-tools` skills there should be treated as
generated/installed artifacts, not edited directly.

Keeping docs in sync: `npm run check-agent-tools-sync` compares each
`docs/agent-tools/*.md` page against the `languageModelTools` declared in the
sibling extension repo's `package.json` and fails on drift. Run it before
tagging a release.

## Publish a new version (maintainers)

The root `apm.yml` is a monorepo-hybrid marketplace with **lockstep** versioning — one tag ships all packages.

Validate a plugin package from its package folder:

```powershell
Set-Location packages/openapi
apm pack --dry-run --verbose
Set-Location ..\..
```

> **Note:** With the plugin layout, `apm compile --validate` reports "No APM content found" because it only scans `.apm/`. Use `apm pack --dry-run --verbose` instead — it validates the plugin bundle and should include both the instruction and the skill, for example:

```text
instructions/openedge-openapi.instructions.md
skills/openapi-ai-tools/SKILL.md
plugin.json
```

Validate all plugin packages:

```powershell
Get-ChildItem packages -Directory | ForEach-Object {
  Push-Location $_.FullName
  apm pack --dry-run --verbose
  Pop-Location
}
```

Build the root marketplace index and tag the release:

```powershell
apm pack
git tag v0.2.0
git push --tags
```
