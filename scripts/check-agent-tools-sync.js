#!/usr/bin/env node
/**
 * check-agent-tools-sync.js
 *
 * Verifies that each docs/agent-tools/*.md page lists exactly the tools declared
 * in the source extension repo's package.json (`languageModelTools[].toolReferenceName`).
 *
 * The source repos are expected as sibling checkouts of this repo. Override any
 * path with an environment variable (see `targets` below).
 *
 * Usage:  node scripts/check-agent-tools-sync.js
 * Exit code 0 = in sync, 1 = drift detected or a source repo/package.json missing.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const siblings = path.resolve(repoRoot, '..');

// doc -> source repo (env var override -> default sibling path)
const targets = [
  {
    doc: 'docs/agent-tools/datadigger.md',
    repo: process.env.DATADIGGER_REPO || path.join(siblings, 'vscode-openedge-datadigger'),
  },
  {
    doc: 'docs/agent-tools/dictionary.md',
    repo: process.env.DICTIONARY_REPO || path.join(siblings, 'vscode-openedge-dictionary'),
  },
  {
    doc: 'docs/agent-tools/hck.md',
    repo: process.env.HCK_REPO || path.join(siblings, 'vscode-openEdge-HCK'),
  },
  {
    doc: 'docs/agent-tools/pasoe.md',
    repo: process.env.PASOE_REPO || path.join(siblings, 'vscode-openedge-pasoe'),
  },
  {
    doc: 'docs/agent-tools/config-management.md',
    repo: process.env.CONFIG_MANAGEMENT_REPO || path.join(siblings, 'vscode-openedge-config-management'),
  },
  // openapi.md documents the standalone MCP server (no languageModelTools) — not checked here.
];

let failures = 0;

for (const { doc, repo } of targets) {
  const docPath = path.join(repoRoot, doc);
  const pkgPath = path.join(repo, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    console.warn(`SKIP  ${doc} — source repo not found: ${pkgPath}`);
    continue;
  }
  if (!fs.existsSync(docPath)) {
    console.error(`FAIL  ${doc} — doc file missing`);
    failures++;
    continue;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const tools = (pkg.contributes && pkg.contributes.languageModelTools) || [];
  const declared = new Set(tools.map((t) => t.toolReferenceName).filter(Boolean));

  const docText = fs.readFileSync(docPath, 'utf8');
  const documented = new Set();
  for (const match of docText.matchAll(/`#([A-Za-z0-9_]+)`/g)) {
    documented.add(match[1]);
  }

  const missingInDoc = [...declared].filter((t) => !documented.has(t));
  const unknownInDoc = [...documented].filter((t) => !declared.has(t));

  if (missingInDoc.length === 0 && unknownInDoc.length === 0) {
    console.log(`OK    ${doc} (${declared.size} tools)`);
  } else {
    failures++;
    console.error(`FAIL  ${doc}`);
    if (missingInDoc.length) {
      console.error(`      declared in package.json but missing from doc: ${missingInDoc.join(', ')}`);
    }
    if (unknownInDoc.length) {
      console.error(`      referenced in doc but not declared in package.json: ${unknownInDoc.join(', ')}`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} doc(s) out of sync. Update docs/agent-tools/ to match the source package.json.`);
  process.exit(1);
}
console.log('\nAll agent-tools docs are in sync.');
