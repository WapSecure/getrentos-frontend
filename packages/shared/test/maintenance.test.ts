import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HOME_ASSET_CATEGORY_SUGGESTIONS,
  MAINTENANCE_CATEGORY_CODES,
  MAINTENANCE_CATEGORY_GROUPS,
  MAINTENANCE_CATEGORY_LABELS,
  humaniseMaintenanceStatusLine,
  maintenanceCategoryGroup,
  maintenanceCategoryIconName,
  maintenanceCategoryLabel,
  maintenanceStatusLabel,
  toMaintenanceCategoryCode,
} from '../src/utils/maintenance.ts';

test('every category has a plain label, never a raw code', () => {
  for (const code of MAINTENANCE_CATEGORY_CODES) {
    const label = MAINTENANCE_CATEGORY_LABELS[code];
    assert.ok(label, code);
    assert.doesNotMatch(label, /_/);
    assert.notEqual(label, code);
  }
});

test('labels the Nigerian service categories in plain British English', () => {
  assert.equal(maintenanceCategoryLabel('GENERATOR_POWER'), 'Generator and power');
  assert.equal(maintenanceCategoryLabel('water_borehole'), 'Water and borehole');
  assert.equal(maintenanceCategoryLabel('PEST_CONTROL'), 'Pest control and fumigation');
  assert.equal(maintenanceCategoryLabel('roofing'), 'Roofing and leaks');
  assert.equal(maintenanceCategoryLabel('DRAINAGE'), 'Drainage and flooding');
  assert.equal(maintenanceCategoryLabel('AIR_CONDITIONING'), 'Air conditioning');
  assert.equal(maintenanceCategoryLabel('PLUMBING'), 'Plumbing');
});

test('unknown categories read as sentence case and empty ones as Other', () => {
  assert.equal(maintenanceCategoryLabel('SOLAR-BATTERY'), 'Solar battery');
  assert.equal(maintenanceCategoryLabel(undefined), 'Other');
  assert.equal(maintenanceCategoryLabel(''), 'Other');
  assert.equal(toMaintenanceCategoryCode('not a code'), null);
});

test('every category sits in exactly one group', () => {
  const grouped = MAINTENANCE_CATEGORY_GROUPS.flatMap((group) => group.categories);
  assert.equal(grouped.length, MAINTENANCE_CATEGORY_CODES.length);
  assert.deepEqual([...grouped].sort(), [...MAINTENANCE_CATEGORY_CODES].sort());
  assert.equal(maintenanceCategoryGroup('generator_power').id, 'power-water');
  assert.equal(maintenanceCategoryGroup('nonsense').id, 'other');
});

test('icons fall back to the tag for unknown categories', () => {
  assert.equal(maintenanceCategoryIconName('plumbing'), 'Droplets');
  assert.equal(maintenanceCategoryIconName('GENERATOR_POWER'), 'Power');
  assert.equal(maintenanceCategoryIconName('mystery'), 'Tag');
});

test('statuses read as plain words', () => {
  assert.equal(maintenanceStatusLabel('RESOLVED'), 'Resolved');
  assert.equal(maintenanceStatusLabel('in_progress'), 'In progress');
  assert.equal(maintenanceStatusLabel(null), 'Unknown');
  assert.equal(humaniseMaintenanceStatusLine('Status: RESOLVED'), 'Status: Resolved');
  assert.equal(humaniseMaintenanceStatusLine('Plumbing job'), 'Plumbing job');
});

test('suggests the common Nigerian home assets', () => {
  for (const asset of ['Generator', 'Inverter', 'Borehole', 'Water tank', 'Fire extinguisher']) {
    assert.ok((HOME_ASSET_CATEGORY_SUGGESTIONS as readonly string[]).includes(asset), asset);
  }
});
