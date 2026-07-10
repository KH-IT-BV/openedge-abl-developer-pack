// Standalone smoke test for the bundled datadigger MCP server.
//
// Spawns mcp-servers/datadigger/index.cjs exactly as a harness would (its own
// bundled launcher + OE backend + datadigger.pl), speaks MCP over stdio with a
// tiny dependency-free JSON-RPC client (newline-delimited), and runs real tool
// calls against a live database using an inline `conn` override.
//
// Usage (PowerShell):
//   $env:OEDP_MCP_HOME = "g:/git/openedge-abl-developer-pack/mcp-servers"
//   node scripts/smoke-datadigger.mjs "-db sports2020 -H localhost -S 6900"

import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Kill the whole child tree — on Windows the spawned launcher + OE backend are
// not reaped by a plain SIGTERM to the parent, which would orphan _progres.
function killTree(proc) {
  if (!proc || proc.killed) return;
  if (process.platform === 'win32') {
    try { execSync(`taskkill /PID ${proc.pid} /T /F`, { stdio: 'ignore' }); } catch { /* already gone */ }
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

const serverEntry = path.join(HOME, 'datadigger', 'index.cjs');
const env = {
  ...process.env,
  DLC,
  DATADIGGER_MCP_LAUNCHER_PATH: path.join(HOME, 'datadigger', 'native', 'launcher', 'datadiggerLauncherCli.js'),
  DATADIGGER_MCP_BACKEND_PATH: path.join(HOME, 'datadigger', 'datadigger_backend'),
  DATADIGGER_MCP_WRITES_ENABLED: 'false',
  // Alternate ports so we never collide with an already-running backend.
  DATADIGGER_MCP_HTTP_PORT: process.env.DATADIGGER_MCP_HTTP_PORT || '23204',
  DATADIGGER_MCP_ABL_SOCKET_PORT: process.env.DATADIGGER_MCP_ABL_SOCKET_PORT || '23201',
  DATADIGGER_MCP_STARTUP_TIMEOUT_MS: '60000',
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
  console.log('[1/3] initialize       -> OK (backend is up + ABL connected)');

  const tools = await rpc('tools/list', {});
  const names = tools.tools.map((t) => t.name);
  console.log(`[2/3] tools/list       -> ${names.length} tools (${names.slice(0, 4).join(', ')} …)`);

  const tablesRes = await rpc('tools/call', {
    name: 'datadigger-list_tables',
    arguments: { database: DB, conn: CONN },
  });
  if (tablesRes.isError) throw new Error(`list_tables error: ${textOf(tablesRes)}`);
  console.log('[3/3] list_tables      -> OK');
  console.log('      ' + textOf(tablesRes).replace(/\n/g, '\n      '));

  const countRes = await rpc('tools/call', {
    name: 'datadigger-count_table',
    arguments: { database: DB, table: 'Customer', conn: CONN },
  });
  console.log('      count Customer   -> ' + textOf(countRes).replace(/\n/g, ' '));

  console.log('\nPASS: bundled datadigger MCP server works standalone.');
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
