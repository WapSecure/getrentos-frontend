#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = join(root, 'config', 'ui-control-baseline.json');
const sourceRoots = ['apps/web', 'apps/backoffice'];
const tags = new Set(['input', 'select', 'textarea']);
const update = process.argv.includes('--update');
const reviewedSpecializations = new Map([
  [
    'apps/web/components/land/buyer/StartPurchaseDialog.tsx',
    'Native radio preserves form semantics around a rich payment-plan label that contains its own interactive disclosure.',
  ],
]);

function filesUnder(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    if (entry.isDirectory()) return filesUnder(child);
    return entry.isFile() && /\.tsx?$/.test(entry.name) ? [child] : [];
  });
}

function normalize(markup) {
  return markup
    .replace(/\s+/g, ' ')
    .replace(/\s*([={}])\s*/g, '$1')
    .trim();
}

function attribute(markup, name) {
  const match = markup.match(
    new RegExp(`\\b${name}=(?:["']([^"']*)["']|\\{["']([^"']*)["']\\})`, 'i')
  );
  return match?.[1] ?? match?.[2];
}

function classify(path, tag, markup) {
  const type = attribute(markup, 'type')?.toLowerCase();
  const hidden = /className=["'][^"']*\bhidden\b/.test(markup);
  if (tag === 'input' && (type === 'file' || type === 'hidden' || hidden)) {
    return {
      classification: 'platform-bridge',
      rationale:
        'Native file/hidden input used as a browser integration point; the visible control must remain shared.',
    };
  }
  if (/OtpInput\.tsx$/.test(path)) {
    return {
      classification: 'specialized-control',
      rationale: 'Raw inputs are encapsulated inside the shared OTP control.',
    };
  }
  if (tag === 'input' && type === 'radio' && reviewedSpecializations.has(path)) {
    return {
      classification: 'specialized-control',
      rationale: reviewedSpecializations.get(path),
    };
  }
  return {
    classification: 'migration-backlog',
    rationale: 'Visible one-off control to migrate to the shared UI kit or explicitly justify.',
  };
}

function scan() {
  const occurrences = [];
  for (const sourceRoot of sourceRoots) {
    for (const file of filesUnder(join(root, sourceRoot))) {
      const path = relative(root, file);
      const source = readFileSync(file, 'utf8');
      // JSX intrinsic elements are lowercase. Keep this case-sensitive so shared
      // components such as <Input>, <Select> and <Textarea> are not counted.
      const matcher = /<(input|select|textarea)\b[\s\S]*?>/g;
      for (const match of source.matchAll(matcher)) {
        const tag = match[1].toLowerCase();
        if (!tags.has(tag)) continue;
        const markup = normalize(match[0]);
        const fingerprint = createHash('sha256')
          .update(`${path}\0${tag}\0${markup}`)
          .digest('hex')
          .slice(0, 16);
        const line = source.slice(0, match.index).split('\n').length;
        occurrences.push({ path, tag, fingerprint, line, ...classify(path, tag, markup) });
      }
    }
  }
  return occurrences;
}

function aggregate(occurrences) {
  const entries = new Map();
  for (const item of occurrences) {
    const key = `${item.path}\0${item.tag}\0${item.fingerprint}`;
    const existing = entries.get(key);
    if (existing) {
      existing.count += 1;
      existing.lines.push(item.line);
    } else {
      entries.set(key, { ...item, count: 1, lines: [item.line] });
    }
  }
  return [...entries.values()].sort(
    (a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.tag.localeCompare(b.tag)
  );
}

const current = aggregate(scan());

if (update) {
  const baseline = {
    version: 1,
    generatedAt: new Date().toISOString(),
    policy:
      'Existing entries are debt or reviewed platform exceptions. Counts may decrease; additions require review.',
    entries: current,
  };
  writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(
    `Updated ${relative(root, baselinePath)} with ${current.reduce((n, item) => n + item.count, 0)} controls.`
  );
  process.exit(0);
}

if (!statSync(baselinePath).isFile()) throw new Error('UI control baseline is missing.');
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
const allowed = new Map(
  baseline.entries.map((item) => [`${item.path}\0${item.tag}\0${item.fingerprint}`, item.count])
);
const additions = current.filter(
  (item) => item.count > (allowed.get(`${item.path}\0${item.tag}\0${item.fingerprint}`) ?? 0)
);

const total = current.reduce((n, item) => n + item.count, 0);
const debt = current
  .filter((item) => item.classification === 'migration-backlog')
  .reduce((n, item) => n + item.count, 0);
const exceptions = total - debt;

if (additions.length) {
  console.error('\nUI control audit failed. New or changed raw controls were found:\n');
  for (const item of additions) {
    console.error(
      `- ${item.path}:${item.line} <${item.tag}> (${item.count} occurrence${item.count === 1 ? '' : 's'})`
    );
  }
  console.error(
    '\nUse a shared @getrentos/ui control. If a raw browser control is essential, document it and intentionally refresh the baseline with `pnpm audit:ui-controls:update`.\n'
  );
  process.exit(1);
}

console.log(
  `UI control audit passed: ${total} baseline controls (${debt} migration backlog, ${exceptions} reviewed exceptions); no additions.`
);
