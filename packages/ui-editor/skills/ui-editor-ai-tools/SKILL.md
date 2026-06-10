---
name: ui-editor-ai-tools
description: >-
  AI-tool surface for the API4UI - UI Designer & Toolbox VS Code extension (package `api4ui`,
  publisher AI4YOU). How an AI agent drives it: the bundled OpenEdge MCP server, the `.w` ↔ CraftJS
  round-trip logic, the designer custom editor, and ABL create/compile/run command IDs. Use when
  an agent must design/edit OpenEdge ABL (`.w`) UI, scaffold ABL artifacts, or compile/run ABL.
---

# API4UI (UI Editor) — AI tools

Extension: package `api4ui`, displayName "API4UI - UI Designer & Toolbox", publisher `AI4YOU`,
`main` `./dist/extension.js`. Visually designs OpenEdge ABL `.w` files (CraftJS webview) and
scaffolds/compiles/runs ABL. It is the **only** plugin that bundles its own OpenEdge MCP server.

## AI entry points (in priority order)

1. **Bundled OpenEdge MCP server** — richest AI surface. Lifecycle via commands:
   - `openedge-abl-ui.startMcpServer`, `openedge-abl-ui.stopMcpServer`, `openedge-abl-ui.restartMcpServer`
   - `openedge-abl-ui.mcpServerStatus`, `openedge-abl-ui.showMcpLogs`
   - Runs over stdio; configure it as an MCP server for the agent. Prefer this for headless use.
2. **Headless `.w` round-trip logic** — `src/util/wFileParser.ts` (`.w` ↔ CraftJS JSON),
   `src/openedge/progressWParser.ts`, templates in `src/util/templates/openedge/*`. Largely
   `vscode`-free; CLI extraction planned. Until then, reach it via the MCP server.
3. **VS Code commands** — only when an agent runs inside VS Code and can invoke commands.

## Designer custom editor

- viewType `designer.designerEditor` — opens `.w`, `.html`, `.vue`, `.js/.jsx/.ts/.tsx`, `.svelte`.
- Open `.w` in designer: `openedge-abl-ui.openInDesigner` (keybinding `ctrl+shift+f8` on `.w`).
- Back to text: `openedge-abl-ui.switchToTextEditor` (`ctrl+shift+f9`).
- Live visual state needs VS Code running (bridge path only).

## Useful command IDs (prefix `openedge-abl-ui.`)

| Area | Commands |
|---|---|
| Designer | `openInDesigner`, `openInDesignerClsOnHold`, `switchToTextEditor`, `createNewUIDesign` |
| Scaffold ABL | `createClass`, `createInterface`, `createEnum`, `createInclude`, `createProcedure`, `createStructuredProcedure`, `createStructuredInclude`, `createWebHandler`, `createCGIWrapper`, `createSpeedscript`, `createBusinessEntity`, `createABLService`, `createForm`, `createDialog`, `createMdiForm`, `createUserControl`, `createInheritedControl` |
| Class members | `addMethod`, `addConstructor`, `addDestructor`, `addProcedure`, `addFunction`, `updateFunctionPrototypes` |
| Compile | `compileWithOptions`, `compileWithXref`, `compileWithDebugList`, `compileWithListing`, `compileWithPreprocess` |
| Run | `runGui`, `runChui`, `runBatch` |
| Project | `initializeWorkspaceProjects`, `initializeProjectConfig`, `analyzeComponents`, `createUpdateAssembliesXml` |

> `*FromPalette` variants (category "API4UI") are palette-driven equivalents.
> `*Placeholder` commands (Angular/React/Flutter/…) are disabled stubs — not usable.

## How an agent should drive it

- `.w` editing without a human in VS Code: start the OpenEdge MCP server and use its tools.
- Scaffolding/compile/run: VS Code commands today — require a running extension.

## Limitations / readiness

- No standalone `wFileParser` CLI yet (planned). Headless access is via the MCP server.
- Live visual preview/selection requires VS Code.
