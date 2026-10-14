#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const mode = process.argv[2];
const root = process.cwd();

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

const fail = (message) => {
  console.error(`\nRepository preflight failed: ${message}\n`);
  process.exit(1);
};

if (mode !== 'feature' && mode !== 'dev-sync') {
  fail('use "feature" before starting work or "dev-sync" after synchronizing local dev.');
}

let status;
let head;
let originDev;

try {
  status = git('status', '--porcelain');
  head = git('rev-parse', 'HEAD');
  originDev = git('rev-parse', 'origin/dev');
} catch {
  fail('run this command from a Git worktree with origin/dev available.');
}

if (status) fail('the worktree is not clean. Commit, stash, or remove its changes first.');
if (head !== originDev)
  fail(`HEAD (${head.slice(0, 8)}) does not match origin/dev (${originDev.slice(0, 8)}).`);

if (mode === 'feature') {
  const gitDir = resolve(root, git('rev-parse', '--git-dir'));
  const commonDir = resolve(root, git('rev-parse', '--git-common-dir'));
  if (gitDir === commonDir) {
    fail('feature work must start in an isolated linked worktree, not the primary checkout.');
  }
  console.log(`Feature preflight passed at ${head.slice(0, 8)} in an isolated clean worktree.`);
  process.exit(0);
}

const branch = git('branch', '--show-current');
if (branch !== 'dev')
  fail(`post-sync validation must run on local dev, not ${branch || 'detached HEAD'}.`);

console.log(`Repository sync checks passed at ${head.slice(0, 8)}. Running the web type-check…`);
const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const result = spawnSync(command, ['--filter', 'web', 'type-check'], {
  cwd: root,
  stdio: 'inherit',
});

if (result.error) fail(`could not start the web type-check: ${result.error.message}`);
if (result.status !== 0) fail('the synchronized dev branch failed the web type-check.');

console.log(`Post-sync validation passed at ${head.slice(0, 8)}.`);
