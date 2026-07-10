// Standalone smoke test for the bundled hck (Health Check Kit) MCP server.
//
// Spawns mcp-servers/hck/index.cjs (its own bundled launcher + OE backend + hck.pl),
// speaks MCP over stdio, and runs a real diagnostic tool call against a live database
// using an inline `conn` string.
//
// Usage (PowerShell):
//   $env:OEDP_MCP_HOME = "g:/git/openedge-abl-developer-pack/mcp-servers"
//   node scripts/smoke-hck.mjs "-db sports2020 -H localhost -S 6900"

import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function killTree(proc) {
  if (!proc || proc.killed) return;
  if (process.platform === 'win32') {
    try { execSync(`taskkill /PID ${proc.pid} /T /F`, { stdio: 'ignore' }); } catch { /* gone */ }
  } else {
    proc.kill('SIGTERM');
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOME = process.env.OEDP_MCP_HOME
  ? path.resolve(process.env.OEDP_MCP_HOME)
  : path.resolve(__dirname, '..', 'mcp-servers');

const CONN = process.argv[2] || '-db sports2020 -H localhost -S 6900';
const DB = 'sports2020';
const DLC = process.env.DLC || 'C:/Program Files/Progress Software/OpenEdge/dlc128';

const serverEntry = path.join(HOME, 'hck', 'index.cjs');
const env = {
  ...process.env,
  DLC,
  HCK_MCP_LAUNCHER_PATH: path.join(HOME, 'hck', 'native', 'launcher', 'hckLauncherCli.js'),
  HCK_MCP_BACKEND_PATH: path.join(HOME, 'hck', 'hck_backend'),
  // Alternate ports so we never collide with an already-running backend.
  HCK_MCP_HTTP_PORT: process.env.HCK_MCP_HTTP_PORT || '23413',
  HCK_MCP_ABL_SOCKET_PORT: process.env.HCK_MCP_ABL_SOCKET_PORT || '23410',
  HCK_MCP_STARTUP_TIMEOUT_MS: '60000',
};

const child = spawn(process.execPath, [serverEntry], { env, stdio: ['pipe', 'pipe', 'pipe'] });

const pending = new Map();
let buf = '';
child.stdout.on('data', (d) => {
  buf += d.toString();
  let nl;
  while ((nl = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id !== undefined && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  }
});
child.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));

let nextId = 1;
function rpc(method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, (m) => (m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)));
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}
function notify(method, params) {
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
}

const hardTimeout = setTimeout(() => {
  console.error('FAIL: overall timeout (90s)');
  killTree(child);
  process.exit(1);
}, 90000);

function textOf(result) {
  const t = result?.content?.find((c) => c.type === 'text')?.text ?? '';
  return t.length > 600 ? t.slice(0, 600) + ' …(truncated)' : t;
}

async function main() {
  console.log(`> server : ${serverEntry}`);
  console.log(`> conn   : ${CONN}`);
  console.log('> booting bundled launcher + OE backend (this can take ~15-40s)…\n');

  await rpc('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'pack-smoke', version: '1.0.0' },
  });
  notify('notifications/initialized', {});
  console.log('[1/3] initialize        -> OK (backend is up + ABL connected)');

  const tools = await rpc('tools/list', {});
  const names = tools.tools.map((t) => t.name);
  console.log(`[2/3] tools/list        -> ${names.length} tools (${names.slice(0, 4).join(', ')} …)`);

  const res = await rpc('tools/call', { name: 'get_connections', arguments: { db: DB, conn: CONN } });
  if (res.isError) throw new Error(`get_connections error: ${textOf(res)}`);
  console.log('[3/3] get_connections   -> OK');
  console.log('      ' + textOf(res).replace(/\n/g, '\n      '));

  console.log('\nPASS: bundled hck MCP server works standalone.');
  clearTimeout(hardTimeout);
  killTree(child);
  process.exit(0);
}

main().catch((err) => {
  console.error(`\nFAIL: ${err?.message ?? err}`);
  clearTimeout(hardTimeout);
  killTree(child);
  process.exit(1);
});
