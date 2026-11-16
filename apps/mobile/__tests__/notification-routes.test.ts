import { routeForActionUrl, routeForNotification } from '@/lib/notificationRoutes';

describe('notification routes', () => {
  it('maps web action paths onto native screens, tolerating host, query and /dashboard', () => {
    expect(routeForActionUrl('/renter/payments')).toBe('/(app)/payments');
    expect(routeForActionUrl('https://getsureground.io/dashboard/renter/lease/?tab=docs')).toBe(
      '/(app)/lease'
    );
    expect(routeForActionUrl('/renter/nowhere')).toBeNull();
  });

  it('opens each side of a viewing on its own viewings screen', () => {
    expect(routeForActionUrl('/renter/viewings')).toBe('/(app)/viewings');
    expect(routeForActionUrl('/buyer/viewings')).toBe('/(app)/buyer-viewings');
    expect(routeForActionUrl('/landlord/viewing-requests')).toBe('/(app)/landlord-viewings');
    expect(routeForActionUrl('/owner/viewings')).toBe('/(app)/owner-viewings');
  });

  it("opens a renter's viewing request on an owner's own viewings screen", () => {
    const n = { type: 'VIEWING_REQUESTED', actionUrl: '/landlord/viewing-requests' };
    expect(routeForNotification(n, 'owner')).toBe('/(app)/owner-viewings?tab=renters');
    expect(routeForNotification(n, 'landlord')).toBe('/(app)/landlord-viewings');
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

  it('opens the gate tools for overstays and missed patrols', () => {
    expect(routeForNotification({ type: 'ESTATE_VISIT_OVERSTAY' }, 'estate')).toBe(
      '/(app)/estate-dwell'
    );
    expect(routeForNotification({ type: 'ESTATE_PATROL_MISSED' }, 'estate')).toBe(
      '/(app)/estate-patrol'
    );
    expect(routeForNotification({ type: 'ESTATE_VISITOR_ARRIVED' }, 'estate')).toBe(
      '/(app)/estate-visitors'
    );
  });

  it('opens a resident’s deliveries and visitor passes for gate events, never Messages', () => {
    for (const portal of ['renter', 'resident'] as const) {
      expect(routeForNotification({ type: 'ESTATE_DELIVERY_RECEIVED' }, portal)).toBe(
        '/(app)/deliveries'
      );
      expect(routeForNotification({ type: 'ESTATE_VISITOR_DEPARTED' }, portal)).toBe(
        '/(app)/visitor-passes'
      );
      expect(
        routeForNotification(
          { type: 'ESTATE_DELIVERY_RECEIVED', actionUrl: '/resident/deliveries' },
          portal
        )
      ).toBe('/(app)/deliveries');
    }
  });

  it('takes a committee member to the document waiting for their signature', () => {
    expect(
      routeForNotification(
        { type: 'ESTATE_SIGNATURE_REQUESTED', actionUrl: '/resident/governance' },
        'resident'
      )
    ).toBe('/(app)/governance');
  });

  it('opens the conversation a message is in, in the reader’s own portal', () => {
    expect(routeForNotification({ type: 'NEW_MESSAGE', conversationId: 'c1' }, 'landlord')).toBe(
      '/(app)/landlord-conversation/c1'
    );
    expect(routeForNotification({ type: 'NEW_MESSAGE', conversationId: 'c1' }, 'renter')).toBe(
      '/(app)/conversation/c1'
    );
    expect(
      routeForNotification(
        { type: 'NEW_MESSAGE', conversationId: 'c1', actionUrl: '/shortlets/messages' },
        'owner'
      )
    ).toBe('/(app)/shortlet-conversation/c1');
    expect(routeForNotification({ type: 'NEW_MESSAGE', conversationId: 'c1' }, 'gateman')).toBe(
      '/(app)/notifications'
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
    expect(routeForActionUrl('https://app.getsureground.io/owner/documents?tab=shared')).toBe(
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

  it('opens an agency invitation with its token, so a phone-only invitee can accept in the app', () => {
    expect(routeForActionUrl('/agency/join?token=abc%2B1')).toBe(
      '/(app)/agency-join?token=abc%2B1'
    );
    expect(routeForActionUrl('/agency-invite/claim?token=xyz')).toBe(
      '/(app)/agency-invite-claim?token=xyz'
    );
    expect(routeForActionUrl('/agency-invite/claim')).toBeNull();
  });
});

describe('buyer representatives', () => {
  it('takes an appointed representative to the buyers they represent, whatever their role', () => {
    expect(routeForNotification({ actionUrl: '/representing' }, 'renter')).toBe(
      '/(app)/land-representing'
    );
    expect(routeForNotification({ actionUrl: '/land/representing' }, 'landlord')).toBe(
      '/(app)/land-representing'
    );
    expect(routeForActionUrl('/representing/transactions/T1')).toBe(
      '/(app)/land-represented?kind=transaction&id=T1'
    );
    expect(routeForActionUrl('/land/representing/purchases/P1')).toBe(
      '/(app)/land-represented?kind=purchase&id=P1'
    );
  });

  it('takes the buyer to their representatives', () => {
    expect(routeForNotification({ actionUrl: '/buyer/representatives' }, 'buyer')).toBe(
      '/(app)/buyer-land-representatives'
    );
  });
});
