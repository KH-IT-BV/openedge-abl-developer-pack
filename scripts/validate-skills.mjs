// Validate every SKILL.md in the repo.
//
// Checks that each file:
//   * starts with a YAML frontmatter block delimited by `---` ... `---`
//   * defines a non-empty `name`
//   * defines a non-empty `description`
//
// No external dependencies: the frontmatter we use is simple enough to validate
// with a small purpose-built parser (inline scalars + folded/literal blocks).
//
// Usage:
//   node scripts/validate-skills.mjs
//   npm run validate:skills

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'out', 'dist', '.vscode-test']);
const REQUIRED_KEYS = ['name', 'description'];

/** Recursively collect every SKILL.md path under `dir`. */
function findSkillFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    let info;
    try {
      info = statSync(full);
    } catch {
      continue; // dangling symlink or vanished entry
    }
    if (info.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      found.push(...findSkillFiles(full));
    } else if (entry === 'SKILL.md') {
      found.push(full);
    }
  }
  return found;
}

/**
 * Extract the keys present at the top level of a YAML frontmatter block.
 * Returns a map of key -> boolean (true when the key has a non-empty value,
 * either inline or as a folded/literal block scalar with content).
 */
function parseFrontmatterKeys(block) {
  const lines = block.split(/\r?\n/);
  const keys = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Only consider top-level keys (no leading indentation).
    const match = /^([A-Za-z0-9_-]+):(.*)$/.exec(line);
    if (!match) continue;
    const key = match[1];
    const rest = match[2].trim();
    if (rest === '>' || rest === '>-' || rest === '|' || rest === '|-' || rest === '>+' || rest === '|+') {
      // Block scalar: value is on the following indented, non-empty lines.
      let hasContent = false;
      for (let j = i + 1; j < lines.length; j++) {
        if (/^\s+\S/.test(lines[j])) {
          hasContent = true;
          break;
        }
        if (/^\S/.test(lines[j])) break; // next top-level key
      }
      keys[key] = hasContent;
    } else {
      keys[key] = rest.length > 0;
    }
  }
  return keys;
}

/** Validate one SKILL.md file. Returns an array of error strings (empty = ok). */
function validateSkill(file) {
  const errors = [];
  const raw = readFileSync(file, 'utf8');
  // Tolerate a leading BOM but otherwise the file must start with `---`.
  const text = raw.replace(/^﻿/, '');

  if (!text.startsWith('---')) {
    errors.push('does not start with a `---` YAML frontmatter delimiter');
    return errors;
  }

  // The opening delimiter must be its own line.
  const afterOpen = text.slice(3);
  if (!/^\r?\n/.test(afterOpen)) {
    errors.push('frontmatter opening `---` must be on its own line (do not put `--- name:` on one line)');
    return errors;
  }

  // Find the closing delimiter line.
  const closeMatch = /\r?\n---[ \t]*(\r?\n|$)/.exec(text);
  if (!closeMatch) {
    errors.push('frontmatter is not closed with a `---` delimiter line');
    return errors;
  }

  const block = text.slice(afterOpen.indexOf('\n') + 1, closeMatch.index);
  const keys = parseFrontmatterKeys(block);

  for (const key of REQUIRED_KEYS) {
    if (!(key in keys)) {
      errors.push(`missing required key \`${key}\``);
    } else if (!keys[key]) {
      errors.push(`key \`${key}\` is present but empty`);
    }
  }

  return errors;
}

function main() {
  const files = findSkillFiles(ROOT).sort();
  if (files.length === 0) {
    console.error('No SKILL.md files found.');
    process.exit(1);
  }

  let failures = 0;
  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const errors = validateSkill(file);
    if (errors.length === 0) {
      console.log(`ok    ${rel}`);
    } else {
      failures++;
      console.error(`FAIL  ${rel}`);
      for (const err of errors) console.error(`        - ${err}`);
    }
  }

  console.log(`\n${files.length} skill file(s) checked, ${failures} invalid.`);
  if (failures > 0) process.exit(1);
}

main();
