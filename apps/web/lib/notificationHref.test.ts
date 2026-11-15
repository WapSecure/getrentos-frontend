import assert from 'node:assert/strict';
import { test } from 'node:test';
import { notificationHref } from './notificationHref';

test("a guest's booking confirmation opens their trips", () => {
  assert.equal(notificationHref('renter', { type: 'SHORTLET_BOOKING_CONFIRMED' }), '/renter/bookings');
  assert.equal(notificationHref('buyer', { type: 'SHORTLET_DEPOSIT_RELEASED' }), '/buyer/bookings');
});

test('host-only stay notifications are not sent to trips', () => {
  assert.equal(notificationHref('renter', { type: 'SHORTLET_BOOKING_REQUEST' }), null);
});

test('a stored link still wins', () => {
  assert.equal(
    notificationHref('renter', { type: 'SHORTLET_BOOKING_CONFIRMED', actionUrl: '/renter/payments' }),
    '/renter/payments'
  );
});
