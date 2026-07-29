# OpenEdge AI Assistant (`openedge-abl`)

Progress's official **OpenEdge AI Coding Assistant** MCP connector for ABL: a Python
stdio proxy that forwards MCP JSON-RPC to the cloud MCP service on
`openedge.data.progress.cloud` (Progress Data Cloud), handling authentication, token
refresh (every 50 min) and API-key revocation checks automatically.

> **Vendored third-party scripts — not built by `npm run build-mcp`.** `mcp-proxy.py`
> and `mcp-login.py` are distributed verbatim by Progress via the
> [OpenEdge MCP Connector for ABL CVP page](https://community.progress.com/s/question/0D5Pb00003gcdt7KAA/openedge-mcp-connector-for-abl);
> setup is documented in the
> [official CLI configuration guide](https://docs.progress.com/bundle/openedge-ai-coding-assistant-128/page/Configure-the-OpenEdge-AI-Assistant-through-CLI.html).
> To update, re-download from the CVP page and replace the files here.

## Requirements

- Python **3.9+** on `PATH` (stdlib only — no `pip install` needed)
- A valid **Progress Data Cloud API key**
- Network access to `openedge.data.progress.cloud`

## Setup

1. **Login once** (prompts for your PDC API key, saves credentials with an initial
   token to `~/.oemcp/config-pdc-cli.json`, chmod 600):

   ```sh
   python mcp-servers/abl-assistant/mcp-login.py
   ```

2. The server entry is already in [`../mcp.json`](../mcp.json) — no API key in the
   config, the proxy reads `~/.oemcp/config-pdc-cli.json`:

   ```json
   "openedge-abl": {
     "command": "python",
     "args": ["${OEDP_MCP_HOME}/abl-assistant/mcp-proxy.py"]
   }
   ```

   On systems where Python 3 is only available as `python3`, change `command` accordingly.

3. Restart / reload your MCP client. A healthy start logs
   `Token fetched and saved to config (expires in 55 minutes)` on stderr.

Optional: `OE_ABL_MCP_API_KEY` env var overrides the config-file API key (useful for
testing / CI).

## Headless / automated agents (no interactive login)

An unattended bot never runs the interactive login. Two options, both fully
non-interactive:

1. **Env var only (recommended for bots).** Skip `mcp-login.py` entirely — inject the
   PDC API key from your secret store into the server's environment and the proxy
   authenticates and refreshes tokens on its own:

   ```sh
   export OE_ABL_MCP_API_KEY="<pdc-api-key>"   # from CI secrets / vault
   ```

   MCP clients pass their environment to spawned stdio servers, so setting it in the
   agent's runtime env (CI job env, container env, Multica agent runtime) is enough.
   Alternatively pin it explicitly in a private copy of `mcp.json`:

   ```json
   "openedge-abl": {
     "command": "python",
     "args": ["${OEDP_MCP_HOME}/abl-assistant/mcp-proxy.py"],
     "env": { "OE_ABL_MCP_API_KEY": "<pdc-api-key>" }
   }
   ```

   Never commit a file containing the key — the checked-in `mcp.json` deliberately has
   no `env` block for this server.

2. **Scripted one-time login (bootstrap step).** Provisioning scripts can create the
   config file without a prompt:

   ```sh
   python mcp-servers/abl-assistant/mcp-login.py --api-key "$PDC_API_KEY"
   # machine-readable output for automation: add --format json
   ```

   After that the proxy needs no env var (credentials live in
   `~/.oemcp/config-pdc-cli.json`, chmod 600). Use this when the bot host is
   long-lived; use option 1 when it's ephemeral.

Note: even with option 1 the proxy caches refreshed tokens to
`~/.oemcp/config-pdc-cli.json`, so the home directory must be writable.

## Troubleshooting

- **`CONFIGURATION ERROR ... run mcp-login.py`** — you haven't logged in yet (or the
  config file is corrupted). Run step 1 again.
- **`API KEY INVALID OR REVOKED`** — the key was revoked/expired in the PDC dashboard;
  the proxy exits on purpose. Generate a new key and re-run `mcp-login.py`.
- `python mcp-login.py --reset` removes the stored credentials.
