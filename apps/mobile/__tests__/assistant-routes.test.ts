import { mobileRouteFor } from '../lib/api/assistant';

// The paths the server's renter assistant may link to (RENTER_ASSISTANT_LINKS).
const SERVER_PATHS = [
  '/renter/home',
  '/renter/home?tab=lease',
  '/renter/home?tab=deposit',
  '/renter/payments',
  '/renter/applications',
  '/renter/viewings',
  '/renter/maintenance',
  '/renter/messages',
  '/renter/discover',
  '/renter/saved',
  '/renter/roommates',
  '/renter/trust-score',
  '/renter/settings',
  '/renter/help',
  '/renter/support',
];

describe('assistant link routes', () => {
  it.each(SERVER_PATHS)('maps %s to an app screen', (path) => {
    expect(mobileRouteFor(path)).toMatch(/^\/\(app\)\//);
  });

  it('ignores an unknown path', () => {
    expect(mobileRouteFor('https://example.com')).toBeNull();
  });
});
