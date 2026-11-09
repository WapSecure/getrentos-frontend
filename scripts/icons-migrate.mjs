#!/usr/bin/env node
// Moves imports from Lucide to the Sureground icon set. Safe to re-run: a branch that still
// imports Lucide after rebasing onto dev runs `pnpm icons:migrate` and is done.
// Icon names are unchanged; LucideIcon / LucideProps become SgIcon / SgIconProps.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['apps', 'packages'];
const SKIP = new Set(['node_modules', '.next', '.expo', '.turbo', 'dist', 'build', 'icons']);
const check = process.argv.includes('--check');

function* files(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry) || entry.startsWith('.next')) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* files(path);
    else if (/\.(tsx?|jsx?|mjs)$/.test(entry)) yield path;
  }
}

const IMPORT = /(from\s+|import\s*\(\s*|jest\.mock\(\s*|require\(\s*)(['"])lucide-react(-native)?\2/g;
let changed = 0;
const left = [];
for (const root of ROOTS) {
  for (const path of files(root)) {
    const before = readFileSync(path, 'utf8');
    if (!/lucide-react/.test(before)) continue;
    const after = before
      .replace(IMPORT, (_, lead, q, native) => `${lead}${q}@sureground/icons${native ? '/native' : ''}${q}`)
      .replace(/\bLucideIcon\b/g, 'SgIcon')
      .replace(/\bLucideProps\b/g, 'SgIconProps');
    if (after === before) continue;
    if (check) left.push(path);
    else writeFileSync(path, after);
    changed++;
  }
}
if (check) {
  if (left.length) {
    console.error(`${left.length} file(s) still import Lucide. Run: pnpm icons:migrate\n` + left.join('\n'));
    process.exit(1);
  }
  console.log('No Lucide imports left.');
} else {
  console.log(`Moved ${changed} file(s) to @sureground/icons.`);
}
