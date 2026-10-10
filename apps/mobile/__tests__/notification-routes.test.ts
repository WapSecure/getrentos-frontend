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

  it('opens the short-stay inbox for a short-stay chat, whatever the portal', () => {
    for (const portal of ['renter', 'owner', 'landlord'] as const) {
      expect(
        routeForNotification({ type: 'NEW_MESSAGE', actionUrl: '/shortlets/messages' }, portal)
      ).toBe('/(app)/shortlet-messages');
    }
  });

  it('sends an estate listing request to the owner, and the answer to the estate', () => {
    expect(routeForNotification({ type: 'ESTATE_LISTING_REQUESTED' }, 'owner')).toBe(
      '/(app)/estate-agreements'
    );
    expect(routeForNotification({ type: 'ESTATE_LISTING_REQUESTED' }, 'landlord')).toBe(
      '/(app)/estate-agreements'
    );
    expect(routeForNotification({ type: 'ESTATE_LISTING_DECIDED' }, 'estate')).toBe(
      '/(app)/estate-marketplace'
    );
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

describe('realtor notifications', () => {
  it('opens commissions for the escrow release that earned one, not a buyer screen', () => {
    expect(routeForNotification({ type: 'ESCROW_RELEASED' }, 'realtor')).toBe(
      '/(app)/realtor-commissions'
    );
  });

  it('opens the offers a realtor negotiates and their own inbox', () => {
    expect(routeForNotification({ type: 'OFFER_RECEIVED' }, 'realtor')).toBe(
      '/(app)/realtor-offers'
    );
    expect(routeForNotification({ type: 'NEW_MESSAGE' }, 'realtor')).toBe(
      '/(app)/(realtor)/messages'
    );
  });

  it('maps the web realtor paths', () => {
    expect(routeForNotification({ actionUrl: '/realtor/leads' }, 'realtor')).toBe(
      '/(app)/(realtor)/pipeline'
    );
  });
});

describe('estate office notifications', () => {
  it('opens the office’s dues, not a resident’s own, for a manager', () => {
    expect(routeForNotification({ type: 'ESTATE_DUE_OVERDUE' }, 'estate')).toBe(
      '/(app)/(estate)/dues'
    );
    expect(routeForNotification({ type: 'ESTATE_DUE_OVERDUE' }, 'resident')).toBe('/(app)/dues');
  });

  it('maps the web estate paths', () => {
    expect(routeForNotification({ actionUrl: '/estate/households' }, 'estate')).toBe(
      '/(app)/(estate)/households'
    );
  });
});

describe('landlord notifications', () => {
  it('opens the landlord side of rent, leases and repairs, not the renter screens', () => {
    expect(routeForNotification({ type: 'RENT_OVERDUE' }, 'landlord')).toBe(
      '/(app)/landlord-payments'
    );
    expect(routeForNotification({ type: 'LEASE_SIGNED' }, 'landlord')).toBe(
      '/(app)/landlord-leases'
    );
    expect(routeForNotification({ type: 'MAINTENANCE_SUBMITTED' }, 'landlord')).toBe(
      '/(app)/landlord-maintenance'
    );
    expect(routeForNotification({ type: 'APPLICATION_RECEIVED' }, 'landlord')).toBe(
      '/(app)/landlord-applications'
    );
    expect(routeForNotification({ type: 'LEAD_FOLLOW_UP_DUE' }, 'landlord')).toBe(
      '/(app)/landlord-leads'
    );
  });

  it('leaves renters on their own rent and lease screens', () => {
    expect(routeForNotification({ type: 'RENT_OVERDUE' }, 'renter')).toBe('/(app)/payments');
    expect(routeForNotification({ type: 'LEASE_SIGNED' }, 'renter')).toBe('/(app)/lease');
  });

  it('still sends a landlord host to their hosting booking', () => {
    expect(
      routeForNotification({ type: 'SHORTLET_BOOKING_REQUEST', bookingId: 'b1' }, 'landlord')
    ).toBe('/(app)/host/booking/b1');
  });
});

describe('realtor and client updates', () => {
  it('takes each side to where they deal with the other', () => {
    expect(routeForNotification({ type: 'REALTOR_CLIENT_UPDATE' }, 'realtor')).toBe(
      '/(app)/realtor-clients'
    );
    expect(routeForNotification({ type: 'REALTOR_CLIENT_UPDATE' }, 'owner')).toBe(
      '/(app)/representatives'
    );
  });
});
