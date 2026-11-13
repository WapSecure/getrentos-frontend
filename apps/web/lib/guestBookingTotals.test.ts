import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guestBookingTotals } from './guestBookingTotals';

test('the stay figure includes tax, so it matches the quote and the pay button', () => {
  const t = guestBookingTotals({ total: 100_000, taxAmount: 7_500 });
  assert.equal(t.stayWithTax, 107_500);
  assert.equal(t.dueNow, 107_500);
  assert.equal(t.tax, 7_500);
});

test('the refundable deposit is added only to what is due now', () => {
  const t = guestBookingTotals({ total: 100_000, taxAmount: 7_500, deposit: 50_000 });
  assert.equal(t.stayWithTax, 107_500);
  assert.equal(t.dueNow, 157_500);
});

test('missing amounts count as zero', () => {
  assert.deepEqual(guestBookingTotals({ total: 80_000 }), {
    tax: 0,
    deposit: 0,
    stayWithTax: 80_000,
    dueNow: 80_000,
  });
});
