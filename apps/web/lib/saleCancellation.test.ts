import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cancelledBeforePayment } from './saleCancellation';

const open = { label: 'Deposit paid', completed: false };
const done = { label: 'Deposit paid', completed: true };

test('a refunded sale with no completed milestone was never paid', () => {
  assert.equal(
    cancelledBeforePayment({ escrowStatus: 'refunded', milestones: [open, open] }),
    true
  );
});

test('a refunded sale with a completed milestone was paid', () => {
  assert.equal(
    cancelledBeforePayment({ escrowStatus: 'refunded', milestones: [done, open] }),
    false
  );
});

test('only refunded sales count', () => {
  assert.equal(
    cancelledBeforePayment({ escrowStatus: 'deposit_pending', milestones: [open] }),
    false
  );
});

test('missing milestones are not treated as never paid', () => {
  assert.equal(cancelledBeforePayment({ escrowStatus: 'refunded', milestones: [] }), false);
});
