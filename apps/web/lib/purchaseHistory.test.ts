import { test } from 'node:test';
import assert from 'node:assert/strict';
import { purchaseHistoryItems } from './purchaseHistory';

const item = (actor: string, actorKind: 'TENANT' | 'OTHER' | 'YOU' | 'BUYER' | 'SYSTEM') => ({
  id: actor,
  at: '2026-11-12T10:00:00Z',
  label: 'The representative approved',
  actor,
  actorKind,
  important: false,
});

test('a representative tagged as a tenant shows as the representative', () => {
  const [row] = purchaseHistoryItems([item('Amaka Obi', 'TENANT')], [{ name: 'Amaka Obi' }]);
  assert.equal(row.actorKind, 'REPRESENTATIVE');
});

test('a tenant label never shows on a purchase', () => {
  const [row] = purchaseHistoryItems([item('Someone Else', 'TENANT')], [{ name: 'Amaka Obi' }]);
  assert.equal(row.actorKind, 'OTHER');
});

test('roles the API already set in the sale are kept', () => {
  const rows = purchaseHistoryItems(
    [item('You', 'YOU'), item('Ada', 'BUYER'), item('Sureground', 'SYSTEM')],
    [{ name: 'Ada' }]
  );
  assert.deepEqual(
    rows.map((r) => r.actorKind),
    ['YOU', 'BUYER', 'SYSTEM']
  );
});
