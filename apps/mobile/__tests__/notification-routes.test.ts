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
});
