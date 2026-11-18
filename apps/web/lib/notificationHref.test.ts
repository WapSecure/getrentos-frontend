import assert from 'node:assert/strict';
import { test } from 'node:test';
import { notificationHref } from './notificationHref';

test("a guest's booking confirmation opens their trips", () => {
  assert.equal(
    notificationHref('renter', { type: 'SHORTLET_BOOKING_CONFIRMED' }),
    '/renter/bookings'
  );
  assert.equal(notificationHref('buyer', { type: 'SHORTLET_DEPOSIT_RELEASED' }), '/buyer/bookings');
});

test('host-only stay notifications are not sent to trips', () => {
  assert.equal(notificationHref('renter', { type: 'SHORTLET_BOOKING_REQUEST' }), null);
});

test('a stored link still wins', () => {
  assert.equal(
    notificationHref('renter', {
      type: 'SHORTLET_BOOKING_CONFIRMED',
      actionUrl: '/renter/payments',
    }),
    '/renter/payments'
  );
});

test('estate office messages open the right side of the conversation', () => {
  const resident = { type: 'NEW_MESSAGE', actionUrl: '/estate/office-messages' };
  const office = { type: 'NEW_MESSAGE', actionUrl: '/estate/resident-messages' };
  assert.equal(notificationHref('resident', resident), '/resident/messages');
  assert.equal(notificationHref('estate', office), '/estate/resident-messages');
});
