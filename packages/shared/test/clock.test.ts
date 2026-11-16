import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatClock } from '../src/utils/clock.ts';

const at = new Date('2026-11-16T14:10:00Z');

test('12-hour with upper-case AM/PM in Lagos time', () => {
  assert.equal(formatClock(at, { timeZone: 'Africa/Lagos' }), '3:10 PM');
  assert.equal(
    formatClock(at, { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short' }),
    '16 Nov, 3:10 PM'
  );
});

test('a 24-hour request is still written 12-hour', () => {
  assert.equal(
    formatClock(at, { timeZone: 'Africa/Lagos', hour: '2-digit', hourCycle: 'h23' }),
    '3:10 PM'
  );
});

test('an unreadable date gives an empty string', () => {
  assert.equal(formatClock('not a date'), '');
});
