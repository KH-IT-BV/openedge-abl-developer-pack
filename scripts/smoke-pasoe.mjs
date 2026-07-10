// Standalone smoke test for the bundled pasoe MCP server.
//
// pasoe is JS-only (OE Manager REST), so this needs no OpenEdge runtime and no network:
// it writes a throwaway settings-shaped server list, spawns mcp-servers/pasoe/index.cjs,
// and verifies that `pasoe_list_instances` reads the config back (passwords stripped).
//
// Usage:  node scripts/smoke-pasoe.mjs

import { spawn, execSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
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

const serverEntry = path.join(HOME, 'pasoe', 'index.cjs');

// Throwaway server list so the test is self-contained and never touches a user file.
const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'pasoe-smoke-'));
const serversPath = path.join(tmpDir, 'servers.json');
writeFileSync(
  serversPath,
  JSON.stringify(
    {
      'openedge-pasoe.servers': [
        {
          name: 'smoke-oepas1',
          host: 'localhost',
          port: 8810,
          transport: 'http',
          authType: 'basic',
          username: 'tomcat',
          password: 'tomcat',
          sharePlaintextCredentials: true,
        },
      ],
    },
    null,
    2,
  ),
);

const env = { ...process.env, PASOE_SERVERS_CONFIG_PATH: serversPath };
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

function cleanup() {
  killTree(child);
  try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
}

const hardTimeout = setTimeout(() => {
  console.error('FAIL: overall timeout (20s)');
  cleanup();
  process.exit(1);
}, 20000);

function textOf(result) {
  return result?.content?.find((c) => c.type === 'text')?.text ?? '';
}

async function main() {
  console.log(`> server : ${serverEntry}`);
  console.log(`> config : ${serversPath}\n`);

  await rpc('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'pack-smoke', version: '1.0.0' },
  });
  notify('notifications/initialized', {});
  console.log('[1/3] initialize          -> OK');

  const tools = await rpc('tools/list', {});
  const names = tools.tools.map((t) => t.name);
  console.log(`[2/3] tools/list          -> ${names.length} tools (${names.slice(0, 4).join(', ')} …)`);

  const res = await rpc('tools/call', { name: 'pasoe_list_instances', arguments: {} });
  if (res.isError) throw new Error(`pasoe_list_instances error: ${textOf(res)}`);
  const text = textOf(res);
  if (!text.includes('smoke-oepas1')) {
    throw new Error(`configured server not returned. Got: ${text.slice(0, 300)}`);
  }
  if (/"password"\s*:\s*"tomcat"/.test(text)) {
    throw new Error('password leaked in pasoe_list_instances output');
  }
  console.log('[3/3] pasoe_list_instances -> OK (server listed, password stripped)');
  console.log('      ' + text.replace(/\n/g, '\n      '));

  console.log('\nPASS: bundled pasoe MCP server works standalone.');
  clearTimeout(hardTimeout);
  cleanup();
  process.exit(0);
}

main().catch((err) => {
  console.error(`\nFAIL: ${err?.message ?? err}`);
  clearTimeout(hardTimeout);
  cleanup();
  process.exit(1);
});
