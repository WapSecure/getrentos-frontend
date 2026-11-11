import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDualTime, isValidTimeZone, timeZoneCity } from './format';

// 2026-11-11 09:00 UTC is 10:00 in Lagos (UTC+1, no daylight saving).
const NOV = '2026-11-11T09:00:00Z';
// 2026-07-01 09:00 UTC: London is on summer time (UTC+1), level with Lagos.
const JUL = '2026-07-01T09:00:00Z';

test('shows Lagos time next to the viewer time', () => {
  assert.equal(formatDualTime(NOV, 'Europe/London'), '10:00 Lagos · 09:00 London');
});

test('follows daylight saving in the viewer zone', () => {
  assert.equal(formatDualTime(JUL, 'Europe/London'), '10:00 Lagos · 10:00 London');
});

test('names multi-word cities without underscores', () => {
  assert.equal(formatDualTime(NOV, 'America/New_York'), '10:00 Lagos · 04:00 New York');
});

test('adds the weekday when the two times fall on different days', () => {
  // 01:00 Thursday in Lagos is 16:00 Wednesday in Los Angeles.
  assert.equal(
    formatDualTime('2026-11-12T00:00:00Z', 'America/Los_Angeles'),
    'Thu 01:00 Lagos · Wed 16:00 Los Angeles'
  );
});

test('shows Lagos only for a Lagos viewer, a missing zone or an unknown zone', () => {
  assert.equal(formatDualTime(NOV, 'Africa/Lagos'), '10:00 Lagos');
  assert.equal(formatDualTime(NOV, null), '10:00 Lagos');
  assert.equal(formatDualTime(NOV, 'Mars/Olympus_Mons'), '10:00 Lagos');
});

test('accepts a Date and rejects an invalid date', () => {
  assert.equal(formatDualTime(new Date(NOV), 'Asia/Dubai'), '10:00 Lagos · 13:00 Dubai');
  assert.equal(formatDualTime('not a date', 'Europe/London'), '—');
});

test('zone helpers', () => {
  assert.equal(timeZoneCity('America/Argentina/Buenos_Aires'), 'Buenos Aires');
  assert.equal(isValidTimeZone('Europe/London'), true);
  assert.equal(isValidTimeZone('Nowhere/Else'), false);
});
