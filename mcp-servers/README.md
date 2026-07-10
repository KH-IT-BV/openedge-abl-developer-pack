# Bundled MCP servers

Standalone, pre-built MCP servers for the OpenEdge ABL Developer Pack. Each
`<name>/index.cjs` is a **single self-contained bundle** of that plugin's MCP server,
so you can pull this pack and run any server with just Node — no per-repo `npm install`,
no local source paths.

> **Generated artifacts — do not edit by hand.** The canonical source for each server
> lives in its extension repo (e.g. `vscode-openedge-datadigger/mcp-server`). Re-bundle
> with `npm run build-mcp` (from the pack root). A release-time rebuild keeps these in
> sync with source.

## Layout

```
mcp-servers/
  mcp.json                                   # ready-to-use client config (uses ${OEDP_MCP_HOME})
  datadigger/
    index.cjs                                # bundled MCP server (stdio)
    native/launcher/datadiggerLauncherCli.js # bundled launcher (spawns the OE backend)
    datadigger_backend/
      index.js                               # bundled Node backend
      oe/src/datadigger.pl                    # OpenEdge PL (ABL r-code library, ~9 MB)
      oe/src/datadiggerSocket.r               # ABL socket r-code
  dictionary/                                # same shape (schema browse/edit)
    index.cjs
    native/launcher/dictionaryLauncherCli.js
    dictionary_backend/
      index.js
      oe/src/dictionary.pl                    # ~1.2 MB
      oe/src/dictionarySocket.r
  pasoe/                                     # JS-only (remote OE Manager REST)
    index.cjs
    servers.example.json                      # copy to servers.json + fill in your PASOE server(s)
    secrets.example.json                      # optional key->password store
  hck/                                       # same shape (Health Check Kit / DB diagnostics)
    index.cjs
    native/launcher/hckLauncherCli.js
    hck_backend/
      index.js
      oe/src/hck.pl                           # ~44 MB
      oe/src/hckSocket.r
```

Servers that drive an OpenEdge backend ship the **full runtime** — the JS bundle, the
launcher, the Node backend, **and** the OE `.pl`/r-code — so the server works the moment the
pack is pulled (given a local OpenEdge install).

## Use it

1. Set `OEDP_MCP_HOME` to this directory (the installer/APM can template it):
   - PowerShell: `$env:OEDP_MCP_HOME = "<...>/openedge-abl-developer-pack/mcp-servers"`
2. Point any MCP client at `mcp.json`, or attach to a Multica agent:
   ```sh
   multica agent update <agent-id> --mcp-config-file mcp-servers/mcp.json
   ```
   (substitute `${OEDP_MCP_HOME}` with the absolute path first, or export it in the
   agent's runtime env).

## Verify it works

A dependency-free smoke test launches the bundled server (its own launcher + OE backend +
`datadigger.pl`), speaks MCP over stdio, and runs real tool calls against a live database:

```sh
# PowerShell
$env:OEDP_MCP_HOME = "<...>/openedge-abl-developer-pack/mcp-servers"
node scripts/smoke-datadigger.mjs "-db sports2020 -H localhost -S 6900"
node scripts/smoke-dictionary.mjs "-db sports2020 -H localhost -S 6900"
node scripts/smoke-pasoe.mjs        # JS-only, no OpenEdge / network needed
node scripts/smoke-hck.mjs       "-db sports2020 -H localhost -S 6900"
```

Expected: `initialize -> OK`, a `tools/list` count, a tool result, then `PASS`. The OE-backed
smokes (datadigger, dictionary) reap their own backend process tree on exit and require a local
OpenEdge (`DLC`) + a reachable database. `smoke-pasoe` is self-contained (writes a throwaway
server list and reads it back — no OpenEdge, no network).

## Database connections (standalone)

The saved VS Code / Config Management connections are **not required**. The backend resolves
a DB connection in priority order:

1. **Inline `conn`** — every tool accepts an optional `conn` ABL connection string
   (e.g. `-db sports2020 -H localhost -S 6900`). Best for agents: zero config, fully explicit.
2. **Connections file** — `DATADIGGER_OE_CONFIG` (set in `mcp.json`) points at a JSON of
   `{ "connections": [ { "name", "connect" } ] }` — the same shape Config Management saves.
   Copy `datadigger/connections.example.json` to `datadigger/connections.json`, or point the
   env straight at your Config Management connections file. Then tools resolve a DB by `name`.
3. **`DATADIGGER_DB_<NAME>`** env var, then an auto path fallback.

So it works standalone either by passing `conn` per call, or by supplying a small connections
file — no editor settings needed.

## Runtime requirements

The bundle is just JavaScript — it still needs the OpenEdge runtime it wraps:

| Server | Needs |
|---|---|
| `datadigger` | `DLC` (OpenEdge 12.x) + the DataDigger OE backend (`DATADIGGER_MCP_BACKEND_PATH`) + a reachable database |
| `dictionary` | `DLC` (OpenEdge 12.x) + the Dictionary OE backend (`DICTIONARY_MCP_BACKEND_PATH`) + a reachable database |
| `pasoe` | A reachable PASOE server with OE Manager (`PASOE_SERVERS_CONFIG_PATH`). No `DLC` — except the local `pasman` tools (create / list local instances), which use `PASOE_DLC_PATH`. |
| `hck` | `DLC` (OpenEdge 12.x) + the HCK OE backend (`HCK_MCP_BACKEND_PATH`) + a reachable database (VST diagnostics). Pass `db` + an inline `conn` per call. |

So these run on a host with OpenEdge installed (a `local` Multica runtime, or an
OpenEdge-capable container/VM) — packaging distributes the **code**, not OpenEdge.

## Rebuild

```sh
npm run build-mcp            # all configured servers
node scripts/build-mcp-servers.mjs datadigger   # just one
```

Configure which servers are bundled in `scripts/build-mcp-servers.mjs` (`SERVERS`).
