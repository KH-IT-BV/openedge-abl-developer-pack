#!/usr/bin/env node
// Bundle each plugin's MCP server (canonical source lives in its sibling extension
// repo) into a single self-contained file under mcp-servers/<name>/index.cjs, and
// generate mcp-servers/mcp.json. These bundles are GENERATED artifacts — never edit
// them by hand; re-run `npm run build-mcp` to refresh from source.
//
// Usage:  node scripts/build-mcp-servers.mjs [name ...]
//         (no args = build all)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, statSync, cpSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const isWin = process.platform === "win32";
const packRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gitRoot = resolve(packRoot, ".."); // sibling repos live next to the pack
const outRoot = join(packRoot, "mcp-servers");

/**
 * Each server: canonical source in a sibling extension repo, bundled here.
 * env = the launch env keys a consumer must set (documented in mcp.json).
 */
const SERVERS = [
  {
    name: "datadigger",
    repo: "vscode-openedge-datadigger",
    entry: "mcp-server/src/index.ts",
    // The MCP server spawns an OpenEdge backend via a launcher; both — plus the
    // OE .pl / r-code — must ship alongside the JS bundle. Reuse the extension's
    // own build scripts to produce them, then copy the staged output into the pack.
    repoCommands: [
      ["npm", ["run", isWin ? "build-native-launcher:windows" : "build-native-launcher:linux"]],
      ["npm", ["run", isWin ? "build-datadigger-backend:windows" : "build-datadigger-backend:linux"]],
      ["node", ["scripts/stage-datadigger-pl.js"]],
    ],
    copy: [
      { from: "dist/native/launcher/datadiggerLauncherCli.js", to: "native/launcher/datadiggerLauncherCli.js" },
      { from: "dist/datadigger_backend", to: "datadigger_backend" },
    ],
    env: {
      DLC: "C:/Program Files/Progress Software/OpenEdge/dlc128",
      DATADIGGER_MCP_LAUNCHER_PATH: "${OEDP_MCP_HOME}/datadigger/native/launcher/datadiggerLauncherCli.js",
      DATADIGGER_MCP_BACKEND_PATH: "${OEDP_MCP_HOME}/datadigger/datadigger_backend",
      DATADIGGER_MCP_WRITES_ENABLED: "false",
      // Optional: a {name, connect} connections file (same shape Config Management
      // saves) so tools resolve a DB by name. Not required — every tool also accepts
      // an inline `conn` ABL connection string. Copy connections.example.json to
      // connections.json, or point this at your Config Management connections file.
      DATADIGGER_OE_CONFIG: "${OEDP_MCP_HOME}/datadigger/connections.json",
    },
  },
  {
    name: "dictionary",
    repo: "vscode-openedge-dictionary",
    entry: "dictionary_mcp_server/src/index.ts",
    // Same shape as datadigger: the MCP server self-launches an OpenEdge backend via a
    // launcher; ship the launcher + Node backend + dictionary.pl / socket r-code. The
    // backend build script already stages the .pl + .r into dist/dictionary_backend.
    repoCommands: [
      ["npm", ["run", isWin ? "build-native-launcher:windows" : "build-native-launcher:linux"]],
      ["npm", ["run", isWin ? "build-dictionary-backend:windows" : "build-dictionary-backend:linux"]],
    ],
    copy: [
      { from: "dist/native/launcher/dictionaryLauncherCli.js", to: "native/launcher/dictionaryLauncherCli.js" },
      { from: "dist/dictionary_backend", to: "dictionary_backend" },
    ],
    env: {
      DLC: "C:/Program Files/Progress Software/OpenEdge/dlc128",
      DICTIONARY_MCP_LAUNCHER_PATH: "${OEDP_MCP_HOME}/dictionary/native/launcher/dictionaryLauncherCli.js",
      DICTIONARY_MCP_BACKEND_PATH: "${OEDP_MCP_HOME}/dictionary/dictionary_backend",
      // Optional: {name, connect} connections file (same shape Config Management saves).
      // Not required — every tool also accepts an inline `connectionString` override.
      DICTIONARY_OE_CONFIG: "${OEDP_MCP_HOME}/dictionary/connections.json",
    },
  },
  {
    name: "pasoe",
    repo: "vscode-openedge-pasoe",
    entry: "pasoe_mcp_server/src/index.ts",
    // JS-only: PASOE servers are remote (OE Manager REST), so there is no OpenEdge
    // runtime to bundle — just the single JS file. The MCP entry reuses the vscode-free
    // core in src/pasoe (lifecycle/http/config/credentials).
    env: {
      // Settings-shaped server list: { "openedge-pasoe.servers": [ { name, host, port,
      // transport, authType, username, password|secretKey, sharePlaintextCredentials } ] }.
      PASOE_SERVERS_CONFIG_PATH: "${OEDP_MCP_HOME}/pasoe/servers.json",
      // Optional: key -> password map (FileSecretStore). Not needed when servers store a
      // plaintext password with sharePlaintextCredentials = true.
      PASOE_SECRET_STORE_PATH: "${OEDP_MCP_HOME}/pasoe/secrets.json",
      // Optional: only used by the local pasman tools (create / list local instances).
      PASOE_DLC_PATH: "C:/Program Files/Progress Software/OpenEdge/dlc128",
    },
  },
  {
    name: "hck",
    repo: "vscode-openEdge-HCK",
    entry: "mcp-server/src/index.ts",
    // Same self-launching shape as datadigger/dictionary: bundle the launcher + Node
    // backend + hck.pl / socket r-code. The backend build stages the .pl + .r into
    // dist/hck_backend.
    repoCommands: [
      ["npm", ["run", isWin ? "build-native-launcher:windows" : "build-native-launcher:linux"]],
      ["npm", ["run", isWin ? "build-hck-backend:windows" : "build-hck-backend:linux"]],
    ],
    copy: [
      { from: "dist/native/launcher/hckLauncherCli.js", to: "native/launcher/hckLauncherCli.js" },
      { from: "dist/hck_backend", to: "hck_backend" },
    ],
    env: {
      DLC: "C:/Program Files/Progress Software/OpenEdge/dlc128",
      HCK_MCP_LAUNCHER_PATH: "${OEDP_MCP_HOME}/hck/native/launcher/hckLauncherCli.js",
      HCK_MCP_BACKEND_PATH: "${OEDP_MCP_HOME}/hck/hck_backend",
      // HCK tools take an inline `conn` ABL connection string (credentials included) plus a
      // `db` logical name — no separate connections file is required.
    },
  },
  {
    name: "openapi",
    repo: "vscode-openapi",
    entry: "mcp-server/src/index.ts",
    // JS-only: generates OpenEdge ABL code from OpenAPI specs by calling the remote ABL
    // generator API — no OpenEdge runtime to bundle. The mcp-server package is fully
    // self-contained (no vscode imports).
    env: {
      // Default ABL generator API environment (development | 2025q3 | 2025q4 | 2026q1 | 2026q3).
      OPENAPI_DEFAULT_ENVIRONMENT: "2026q1",
      // Optional per-use: OPENAPI_WORKSPACE_PATH (project dir whose .vscode/settings.json
      // holds saved generation configs) and OPENAPI_LICENSE_DOMAIN (licensed API domain).
    },
  },
];

/**
 * Vendored servers: third-party MCP servers checked into mcp-servers/<name>/ verbatim —
 * nothing to build, but they must survive mcp.json regeneration. `key` is the server id
 * in mcp.json (kept as the upstream docs name it, so users recognize the official setup).
 */
const VENDORED = [
  {
    name: "abl-assistant",
    key: "openedge-abl",
    // Progress "OpenEdge AI Coding Assistant" MCP connector for ABL: a Python (3.9+,
    // stdlib-only) stdio proxy to the cloud MCP service on openedge.data.progress.cloud.
    // Requires a one-time login with a Progress Data Cloud API key:
    //   python mcp-servers/abl-assistant/mcp-login.py
    // (credentials land in ~/.oemcp/config-pdc-cli.json; the proxy refreshes tokens itself).
    command: "python",
    entry: "mcp-proxy.py",
  },
];

const wanted = process.argv.slice(2);
const targets = wanted.length ? SERVERS.filter((s) => wanted.includes(s.name)) : SERVERS;
if (!targets.length) {
  console.error(`No matching servers. Known: ${SERVERS.map((s) => s.name).join(", ")}`);
  process.exit(1);
}

const built = [];
for (const s of targets) {
  const entryPath = join(gitRoot, s.repo, s.entry);
  if (!existsSync(entryPath)) {
    console.error(`SKIP ${s.name}: entry not found -> ${entryPath}`);
    continue;
  }
  const outDir = join(outRoot, s.name);
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, "index.cjs");

  console.log(`BUILD ${s.name}  <-  ${entryPath}`);
  execFileSync(
    "npx",
    [
      "--yes",
      "esbuild",
      entryPath,
      "--bundle",
      "--platform=node",
      "--format=cjs",
      "--target=node18",
      "--minify",
      "--legal-comments=none",
      `--outfile=${outFile}`,
    ],
    { stdio: "inherit", shell: true },
  );

  const size = statSync(outFile).size;
  console.log(`  -> ${outFile} (${(size / 1024).toFixed(0)} KB)`);

  // Assemble any companion runtime (launcher + OE backend + .pl/r-code) by
  // reusing the extension repo's own build scripts, then copying the staged output.
  const repoDir = join(gitRoot, s.repo);
  for (const [cmd, cmdArgs] of s.repoCommands ?? []) {
    console.log(`  run (${s.repo}): ${cmd} ${cmdArgs.join(" ")}`);
    execFileSync(cmd, cmdArgs, { cwd: repoDir, stdio: "inherit", shell: true });
  }
  for (const c of s.copy ?? []) {
    const from = join(repoDir, c.from);
    const to = join(outDir, c.to);
    if (!existsSync(from)) {
      console.error(`  MISSING companion artifact: ${from}`);
      continue;
    }
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to, { recursive: true });
    console.log(`  + ${c.to}`);
  }

  built.push(s);
}

// Generate a portable mcp.json. ${OEDP_MCP_HOME} resolves to this mcp-servers dir;
// set it (or let the APM installer template it) before use. Include EVERY configured
// server that has a built bundle on disk — so building a single server does not drop
// the others from mcp.json.
const mcpServers = {};
for (const s of SERVERS) {
  if (!existsSync(join(outRoot, s.name, "index.cjs"))) {
    continue;
  }
  mcpServers[`openedge-${s.name}`] = {
    command: "node",
    args: [`\${OEDP_MCP_HOME}/${s.name}/index.cjs`],
    env: s.env,
  };
}
for (const v of VENDORED) {
  if (!existsSync(join(outRoot, v.name, v.entry))) {
    continue;
  }
  mcpServers[v.key] = {
    command: v.command,
    args: [`\${OEDP_MCP_HOME}/${v.name}/${v.entry}`],
  };
}
writeFileSync(
  join(outRoot, "mcp.json"),
  JSON.stringify({ mcpServers }, null, 2) + "\n",
  "utf8",
);
console.log(
  `\nWrote ${join(outRoot, "mcp.json")} (${Object.keys(mcpServers).length} server(s); built ${built.length} this run).`,
);
console.log("Set OEDP_MCP_HOME to the mcp-servers directory before launching.");
