import { test } from 'node:test';
import assert from 'node:assert/strict';
import { viewingCancelCopy } from './viewingCancel';

test('confirmed viewing names the renter, property and time', () => {
  const at = new Date(2026, 10, 17, 11, 0).toISOString();
  const copy = viewingCancelCopy({
    renterName: 'Tolu Ade',
    propertyName: '2-bed flat, Yaba',
    status: 'confirmed',
    scheduledAt: at,
  });
  assert.equal(copy.title, 'Cancel this viewing?');
  assert.match(copy.description, /^Tolu Ade's viewing of 2-bed flat, Yaba on .+2026/);
  assert.equal(copy.confirmLabel, 'Cancel viewing');
  assert.equal(copy.success, 'Viewing with Tolu Ade cancelled.');
});

test('declining a request uses decline wording', () => {
  const copy = viewingCancelCopy({ renterName: 'Tolu', propertyName: 'Flat', status: 'requested' });
  assert.equal(copy.confirmLabel, 'Decline request');
  assert.equal(copy.description.includes(' on '), false);
  assert.equal(copy.success, 'Viewing request from Tolu declined.');
});

test('falls back when names are missing and never uses em dashes', () => {
  const copy = viewingCancelCopy({
    renterName: '',
    propertyName: '',
    status: 'confirmed',
    scheduledAt: 'bad',
  });
  assert.match(copy.description, /^The renter's viewing of this property will be cancelled/);
  assert.equal(/—/.test(copy.description + copy.title + copy.success), false);
});
