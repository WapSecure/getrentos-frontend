import { test } from 'node:test';
import assert from 'node:assert/strict';
import { preferredSlotValue } from './viewingPrefill';

const NOW = new Date(2026, 10, 12, 9, 0).getTime();

test('prefills the requested slot in local datetime shape', () => {
  const asked = new Date(2026, 10, 17, 11, 0).toISOString();
  assert.equal(preferredSlotValue(asked, NOW), '2026-11-17T11:00');
});

test('keeps odd minutes the renter asked for', () => {
  const asked = new Date(2026, 0, 5, 7, 5).toISOString();
  assert.equal(preferredSlotValue(asked, new Date(2025, 0, 1).getTime()), '2026-01-05T07:05');
});

test('leaves the field empty when nothing was requested', () => {
  assert.equal(preferredSlotValue(undefined, NOW), '');
  assert.equal(preferredSlotValue('not a date', NOW), '');
});

test('leaves the field empty when the requested slot has passed', () => {
  const asked = new Date(2026, 10, 10, 11, 0).toISOString();
  assert.equal(preferredSlotValue(asked, NOW), '');
});
