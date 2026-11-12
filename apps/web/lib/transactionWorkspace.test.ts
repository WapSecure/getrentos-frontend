import { test } from 'node:test';
import assert from 'node:assert/strict';
import { purchaseWorkspaceHref } from './transactionWorkspace';

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
