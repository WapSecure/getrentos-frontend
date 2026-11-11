import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INSPECTION_ON_SITE_TOLERANCE_M, photoLocationSummary } from '../src/utils/landWatch.ts';

const photo = (distanceM: number | null) => ({ distanceM, mimeType: 'image/jpeg' });

test('photo location: counts only photos, within the tolerance', () => {
  const summary = photoLocationSummary([
    photo(0),
    photo(INSPECTION_ON_SITE_TOLERANCE_M),
    photo(INSPECTION_ON_SITE_TOLERANCE_M + 1),
    { distanceM: 5000, mimeType: 'application/pdf' },
  ]);
  assert.equal(summary.total, 3);
  assert.equal(summary.onSite, 2);
  assert.equal(summary.level, 'some');
  assert.equal(summary.label, '2 of 3 photos taken on site');
});

test('photo location: every photo on site reads as all', () => {
  const summary = photoLocationSummary([photo(10), photo(20)]);
  assert.equal(summary.level, 'all');
  assert.equal(summary.tone, 'success');
  assert.equal(summary.label, 'All 2 photos taken on site');
  assert.equal(photoLocationSummary([photo(0)]).label, 'The photo was taken on site');
});

test('photo location: a photo with no location is not on site', () => {
  const summary = photoLocationSummary([photo(null), photo(null)]);
  assert.equal(summary.level, 'none');
  assert.equal(summary.unlocated, 2);
  assert.equal(summary.tone, 'warning');
});

test('photo location: four in five is most', () => {
  const summary = photoLocationSummary([photo(1), photo(1), photo(1), photo(1), photo(900)]);
  assert.equal(summary.level, 'most');
  assert.equal(summary.tone, 'info');
});

test('photo location: no photos says so', () => {
  assert.equal(photoLocationSummary([]).level, 'empty');
  assert.equal(photoLocationSummary([]).label, 'No photos yet');
});
