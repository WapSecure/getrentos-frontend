import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectionSummary, defaultCollectorName } from '../src/utils/deliveryCollection.ts';

const now = new Date(2026, 10, 12, 18, 0);
const today = new Date(2026, 10, 12, 14, 5).toISOString();
const earlier = new Date(2026, 10, 10, 9, 30).toISOString();

test('says nothing for a parcel still at the gate', () => {
  assert.equal(collectionSummary({ residentName: 'Ada Okoro' }, now), undefined);
});

test('names who collected it and when, today', () => {
  const summary = collectionSummary({ collectedAt: today, collectedBy: 'Ada Okoro' }, now);
  assert.match(summary!, /^Collected by Ada Okoro at /);
  assert.doesNotMatch(summary!, / on /);
});

test('adds the day when it was not collected today', () => {
  const summary = collectionSummary({ collectedAt: earlier, collectedBy: 'Ada Okoro' }, now);
  assert.match(summary!, /^Collected by Ada Okoro on 10 Nov at /);
});

test('leaves the name out when none was recorded', () => {
  assert.match(collectionSummary({ collectedAt: today }, now)!, /^Collected at /);
  assert.match(
    collectionSummary({ collectedAt: today, collectedBy: '  ' }, now)!,
    /^Collected at /
  );
});

test('prefills the resident name, trimmed and capped at 100 characters', () => {
  assert.equal(defaultCollectorName({ residentName: '  Chidi Okoro ' }), 'Chidi Okoro');
  assert.equal(defaultCollectorName({ residentName: 'a'.repeat(120) }).length, 100);
  assert.equal(defaultCollectorName({}), '');
});
