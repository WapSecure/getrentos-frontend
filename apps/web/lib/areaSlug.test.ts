import { test } from 'node:test';
import assert from 'node:assert/strict';
import { areaSlug, findBySlug } from './areaSlug';

test('slugs area names for URLs', () => {
  assert.equal(areaSlug('Lekki Phase 1'), 'lekki-phase-1');
  assert.equal(areaSlug('Trans-Amadi'), 'trans-amadi');
  assert.equal(areaSlug('  Victoria Island '), 'victoria-island');
  assert.equal(areaSlug('GRA Phase 2'), 'gra-phase-2');
});

test('finds an entry by its slug', () => {
  const areas = [{ name: 'Lekki' }, { name: 'Lekki Phase 1' }];
  assert.equal(findBySlug(areas, 'lekki-phase-1')?.name, 'Lekki Phase 1');
  assert.equal(findBySlug(areas, 'lekki')?.name, 'Lekki');
  assert.equal(findBySlug(areas, 'ikoyi'), undefined);
});
