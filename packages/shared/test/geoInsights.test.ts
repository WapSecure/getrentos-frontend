import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  commuteSourceNote,
  plausibleWalk,
  shownTravelMode,
  walkabilityView,
} from '../src/utils/geoInsights.ts';

test('a walk faster than 7 km/h is not shown', () => {
  // From the demo: 11.1 km in 48 min, and 27.3 km in 2 hr 2 min.
  assert.equal(plausibleWalk({ distanceMeters: 11_100, durationSeconds: 48 * 60 }), false);
  assert.equal(
    shownTravelMode('walking', { distanceMeters: 27_300, durationSeconds: 122 * 60 }),
    null
  );
  assert.equal(plausibleWalk({ distanceMeters: 4_000, durationSeconds: 50 * 60 }), true);
  const drive = { distanceMeters: 52_800, durationSeconds: 50 * 60 };
  assert.equal(shownTravelMode('driving', drive), drive);
});

test('the commute note says where the estimate came from', () => {
  assert.match(commuteSourceNote('openstreetmap'), /OpenStreetMap/);
  assert.match(commuteSourceNote('google'), /Google Maps/);
  assert.match(commuteSourceNote(undefined), /Estimated/);
});

test('walking distance shows counts, never a score, and unknown is not zero', () => {
  assert.deepEqual(
    walkabilityView({
      heading: 'Within walking distance',
      placesWithin: 18,
      essentialsWithin: 6,
      summary:
        '18 everyday places within about 1 km, including 6 essentials (schools, healthcare, transit, groceries).',
    }),
    {
      heading: 'Within walking distance',
      count: 18,
      summary:
        '18 everyday places within about 1 km, including 6 essentials (schools, healthcare, transit, groceries).',
    }
  );
  assert.equal(walkabilityView(null), null);
  // An older API response.
  assert.equal(
    walkabilityView({
      score: 0,
      label: 'Car-dependent',
      summary: '0 nearby places within 2 km, including 0 essential services.',
    }),
    null
  );
  assert.deepEqual(
    walkabilityView({
      score: 100,
      label: 'Very walkable',
      summary: '25 nearby places within 2 km.',
    }),
    { heading: 'Nearby places', count: null, summary: '25 nearby places within 2 km.' }
  );
});
