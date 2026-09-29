import { routeForActionUrl, routeForNotification } from '@/lib/notificationRoutes';

describe('notification routes', () => {
  it('maps web action paths onto native screens, tolerating host, query and /dashboard', () => {
    expect(routeForActionUrl('/renter/payments')).toBe('/(app)/payments');
    expect(routeForActionUrl('https://getrentos.com/dashboard/renter/lease/?tab=docs')).toBe(
      '/(app)/lease'
    );
    expect(routeForActionUrl('/renter/nowhere')).toBeNull();
  });

  it('falls back by type when the action has no native screen', () => {
    expect(routeForNotification({ type: 'ESCROW_RELEASED' }, 'buyer')).toBe(
      '/(app)/buyer-transactions'
    );
    expect(routeForNotification({ type: 'ESTATE_WALK_IN_REQUESTED' }, 'resident')).toBe(
      '/(app)/visitor-passes'
    );
  });

  it('opens the inbox for a message only in portals that have one', () => {
    expect(routeForNotification({ type: 'NEW_MESSAGE' }, 'landlord')).toBe(
      '/(app)/(landlord)/messages'
    );
    expect(routeForNotification({ type: 'NEW_MESSAGE' }, 'gateman')).toBe('/(app)/notifications');
  });

  it('never returns a dead route', () => {
    expect(routeForNotification({ actionUrl: '/something/new', type: 'WELCOME' }, 'renter')).toBe(
      '/(app)/notifications'
    );
  });

  it('sends a seller to their own side of an offer or escrow', () => {
    expect(routeForNotification({ type: 'OFFER_RECEIVED' }, 'owner')).toBe('/(app)/(owner)/offers');
    expect(routeForNotification({ type: 'ESCROW_RELEASED' }, 'owner')).toBe(
      '/(app)/owner-transactions'
    );
    expect(routeForNotification({ type: 'OFFER_COUNTERED' }, 'buyer')).toBe(
      '/(app)/(buyer)/offers'
    );
  });

  it('opens the owner screens web links point at', () => {
    expect(routeForActionUrl('/owner/trust-profile')).toBe('/(app)/owner-trust-profile');
    expect(routeForActionUrl('https://app.getrentos.com/owner/documents?tab=shared')).toBe(
      '/(app)/owner-documents'
    );
  });
});

describe('hosting notifications', () => {
  it('opens the booking a new request is about, for owners and landlords', () => {
    expect(
      routeForNotification({ type: 'SHORTLET_BOOKING_REQUEST', bookingId: 'b1' }, 'landlord')
    ).toBe('/(app)/host/booking/b1');
    expect(routeForNotification({ type: 'SHORTLET_BOOKING_REQUEST' }, 'owner')).toBe('/(app)/host');
  });

  it('leaves guests on their own bookings', () => {
    expect(routeForNotification({ type: 'SHORTLET_BOOKING_CONFIRMED' }, 'renter')).toBe(
      '/(app)/shortlet-bookings'
    );
  });

  it('opens the exact stay a guest notification is about', () => {
    expect(
      routeForNotification({ type: 'SHORTLET_BOOKING_CONFIRMED', bookingId: 'b9' }, 'renter')
    ).toBe('/(app)/shortlet-stay/b9');
    expect(
      routeForNotification({ type: 'SHORTLET_BOOKING_CANCELLED', bookingId: 'b9' }, 'buyer')
    ).toBe('/(app)/shortlet-stay/b9');
    // Hosts keep their own booking screen.
    expect(
      routeForNotification({ type: 'SHORTLET_BOOKING_CONFIRMED', bookingId: 'b9' }, 'landlord')
    ).not.toBe('/(app)/shortlet-stay/b9');
  });

  it('opens hosting from the web’s shortlet links', () => {
    expect(routeForActionUrl('/landlord/shortlets')).toBe('/(app)/host');
  });
});
