import { test } from 'node:test';
import assert from 'node:assert/strict';
import { purchaseDisputeHref, purchaseWorkspaceHref } from './transactionWorkspace';

test('a purchase links to the buyer or the representative workspace', () => {
  assert.equal(
    purchaseWorkspaceHref({ role: 'BUYER', transactionId: 'tx 1' }),
    '/buyer/transactions/tx%201'
  );
  assert.equal(
    purchaseWorkspaceHref({ role: 'REPRESENTATIVE', transactionId: 'tx1' }),
    '/representing/transactions/tx1'
  );
});

test('a deposit dispute opens its thread and a land case its own page', () => {
  assert.equal(purchaseDisputeHref({ id: 'd 1', kind: 'DEPOSIT' }), '/buyer/disputes/d%201');
  assert.equal(purchaseDisputeHref({ id: 'ld1', kind: 'LAND' }), '/land/disputes/ld1');
});
