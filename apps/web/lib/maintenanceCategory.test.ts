import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maintenanceCategoryLabel } from './maintenanceCategory';
import { pluralize } from './format';

test('names known categories in sentence case', () => {
  assert.equal(maintenanceCategoryLabel('plumbing'), 'Plumbing');
  assert.equal(maintenanceCategoryLabel('electrical'), 'Electrical');
});

test('turns unknown categories into readable sentence case', () => {
  assert.equal(maintenanceCategoryLabel('pest_control'), 'Pest control');
  assert.equal(maintenanceCategoryLabel('ROOF-LEAK'), 'Roof leak');
});

test('falls back to Other when no category is set', () => {
  assert.equal(maintenanceCategoryLabel(undefined), 'Other');
  assert.equal(maintenanceCategoryLabel(''), 'Other');
});

test('counts requests with the right plural', () => {
  assert.equal(pluralize(1, 'request'), '1 request');
  assert.equal(pluralize(3, 'request'), '3 requests');
  assert.equal(pluralize(0, 'request'), '0 requests');
});
