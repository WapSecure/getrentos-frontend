import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatStay } from './visitorStay';

const at = (iso: string) => new Date(iso).getTime();
const arrived = '2026-11-12T10:00:00Z';

test('reads under a minute for someone who just arrived', () => {
  assert.equal(formatStay(arrived, at('2026-11-12T10:00:40Z')), 'under a minute');
});

test('counts minutes, then hours and minutes', () => {
  assert.equal(formatStay(arrived, at('2026-11-12T10:12:00Z')), '12 min');
  assert.equal(formatStay(arrived, at('2026-11-12T12:05:00Z')), '2 h 5 min');
  assert.equal(formatStay(arrived, at('2026-11-12T13:00:00Z')), '3 h');
});

test('never shows a negative stay when the device clock is behind', () => {
  assert.equal(formatStay(arrived, at('2026-11-12T09:58:00Z')), 'under a minute');
});
