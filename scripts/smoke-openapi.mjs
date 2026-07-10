// Standalone smoke test for the bundled openapi MCP server.
//
// openapi is JS-only (generates OpenEdge ABL from OpenAPI specs via the remote ABL
// generator API). This test needs no OpenEdge runtime and no network: it spawns
// mcp-servers/openapi/index.cjs, lists tools, and calls the no-network `list_projects`
// tool against a throwaway workspace.
//
// Usage:  node scripts/smoke-openapi.mjs

import { spawn, execSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
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

const serverEntry = path.join(HOME, 'openapi', 'index.cjs');

// Throwaway workspace with one saved project so list_projects returns a real entry.
const tmpDir = mkdtempSync(path.join(os.tmpdir(), 'openapi-smoke-'));
mkdirSync(path.join(tmpDir, '.vscode'), { recursive: true });
writeFileSync(
  path.join(tmpDir, '.vscode', 'settings.json'),
  JSON.stringify(
    {
      'ai4you-openapi.projectGenerationSettings': {
        'client|abl|smoke.yaml': {
          generatorType: 'client',
          language: 'abl',
          specLocation: 'smoke.yaml',
          configuredOptions: { packageName: 'Smoke.Client' },
          extractToProjectPath: true,
          projectPath: tmpDir,
        },
      },
    },
    null,
    2,
  ),
);

const env = { ...process.env, OPENAPI_WORKSPACE_PATH: tmpDir, OPENAPI_DEFAULT_ENVIRONMENT: '2026q1' };
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
  console.log(`> workspace : ${tmpDir}\n`);

  await rpc('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'pack-smoke', version: '1.0.0' },
  });
  notify('notifications/initialized', {});
  console.log('[1/3] initialize     -> OK');

  const tools = await rpc('tools/list', {});
  const names = tools.tools.map((t) => t.name);
  console.log(`[2/3] tools/list     -> ${names.length} tools (${names.slice(0, 4).join(', ')} …)`);

  const res = await rpc('tools/call', { name: 'list_projects', arguments: {} });
  if (res.isError) throw new Error(`list_projects error: ${textOf(res)}`);
  const text = textOf(res);
  if (!text.includes('smoke.yaml')) {
    throw new Error(`saved project not returned. Got: ${text.slice(0, 300)}`);
  }
  console.log('[3/3] list_projects  -> OK (saved project read back)');
  console.log('      ' + text.replace(/\n/g, '\n      ').slice(0, 500));

  console.log('\nPASS: bundled openapi MCP server works standalone.');
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
