import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { SiteTour } from '../types/siteTour';
import {
  firstGroupWithTours,
  groupTours,
  nextBookedTour,
  tourGroup,
  tourNextStep,
} from './siteTours';

const tour = (over: Partial<SiteTour>): SiteTour => ({
  id: 't',
  status: 'REQUESTED',
  land: 'Plot 4',
  propertyId: 'p',
  city: 'Lekki',
  state: 'Lagos',
  buyerName: 'Ada',
  hostName: 'Bola',
  timeZone: 'Europe/London',
  buyerTimeZone: 'Europe/London',
  proposedSlots: [],
  durationMinutes: 30,
  disclaimer: '',
  createdAt: '2026-11-01T10:00:00Z',
  ...over,
});

test('every status falls in one list', () => {
  assert.equal(tourGroup('REQUESTED'), 'waiting');
  assert.equal(tourGroup('PROPOSED'), 'upcoming');
  assert.equal(tourGroup('SCHEDULED'), 'upcoming');
  assert.equal(tourGroup('COMPLETED'), 'past');
  assert.equal(tourGroup('CANCELLED'), 'past');
  assert.equal(tourGroup('HOST_NO_SHOW'), 'past');
});

test('upcoming lists booked tours first, soonest first', () => {
  const groups = groupTours([
    tour({ id: 'offered', status: 'PROPOSED' }),
    tour({ id: 'later', status: 'SCHEDULED', scheduledAt: '2026-11-20T09:00:00Z' }),
    tour({ id: 'sooner', status: 'SCHEDULED', scheduledAt: '2026-11-12T09:00:00Z' }),
    tour({ id: 'asked', status: 'REQUESTED' }),
    tour({ id: 'done', status: 'COMPLETED', scheduledAt: '2026-10-01T09:00:00Z' }),
  ]);
  assert.deepEqual(
    groups.upcoming.map((t) => t.id),
    ['sooner', 'later', 'offered']
  );
  assert.deepEqual(
    groups.waiting.map((t) => t.id),
    ['asked']
  );
  assert.deepEqual(
    groups.past.map((t) => t.id),
    ['done']
  );
});

test('opens on the first list with tours in it', () => {
  assert.equal(firstGroupWithTours(groupTours([])), 'upcoming');
  assert.equal(firstGroupWithTours(groupTours([tour({ status: 'CANCELLED' })])), 'past');
});

test('the next booked tour ignores ones that have started', () => {
  const now = Date.parse('2026-11-11T12:00:00Z');
  const next = nextBookedTour(
    [
      tour({ id: 'gone', status: 'SCHEDULED', scheduledAt: '2026-11-11T09:00:00Z' }),
      tour({ id: 'next', status: 'SCHEDULED', scheduledAt: '2026-11-13T09:00:00Z' }),
      tour({ id: 'offered', status: 'PROPOSED' }),
    ],
    now
  );
  assert.equal(next?.id, 'next');
});

test('the next step speaks to the person looking', () => {
  assert.match(tourNextStep(tour({ status: 'REQUESTED' }), 'buyer'), /Waiting for the seller/);
  assert.match(tourNextStep(tour({ status: 'REQUESTED' }), 'host'), /Offer up to three times/);
  assert.match(tourNextStep(tour({ status: 'SCHEDULED' }), 'host', true), /record what you showed/);
  assert.match(tourNextStep(tour({ status: 'COMPLETED', buyerRating: 4 }), 'buyer'), /Thank you/);
  assert.match(tourNextStep(tour({ status: 'COMPLETED' }), 'buyer'), /Rate the tour/);
});
