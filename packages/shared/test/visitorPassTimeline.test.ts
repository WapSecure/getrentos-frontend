import { test } from 'node:test';
import assert from 'node:assert/strict';
import { passTimeline } from '../src/utils/visitorPassTimeline';

const fmt = (iso: string) => `D(${iso})`;
const time = (iso: string) => `T(${iso})`;
const base = { expiresAt: 'exp' };

test('a finished visit shows when they came and went, not the expiry', () => {
  assert.equal(
    passTimeline(
      { ...base, status: 'checked_out', checkedInAt: 'in', checkedOutAt: 'out' },
      fmt,
      time
    ),
    'In D(in) · out T(out)'
  );
});

test('someone still inside shows their arrival', () => {
  assert.equal(
    passTimeline({ ...base, status: 'checked_in', checkedInAt: 'in' }, fmt, time),
    'In since D(in)'
  );
});

test('a pass that can still be used shows its expiry', () => {
  assert.equal(passTimeline({ ...base, status: 'pending' }, fmt, time), 'Expires D(exp)');
  assert.equal(passTimeline({ ...base, status: 'approved' }, fmt, time), 'Expires D(exp)');
});

test('expired, refused and revoked passes', () => {
  assert.equal(passTimeline({ ...base, status: 'expired' }, fmt, time), 'Expired D(exp)');
  assert.equal(
    passTimeline({ ...base, status: 'denied', respondedAt: 'r' }, fmt, time),
    'Refused D(r)'
  );
  assert.equal(passTimeline({ ...base, status: 'revoked' }, fmt, time), null);
});
