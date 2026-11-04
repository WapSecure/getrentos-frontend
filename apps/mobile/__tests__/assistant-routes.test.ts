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
  // RENTER_ASSISTANT_LINKS above, LANDLORD_ASSISTANT_LINKS below.
  '/landlord/dashboard',
  '/landlord/properties',
  '/landlord/units',
  '/landlord/tenants',
  '/landlord/leases',
  '/landlord/payments',
  '/landlord/arrears',
  '/landlord/financials',
  '/landlord/maintenance',
  '/landlord/vendors',
  '/landlord/applications',
  '/landlord/viewing-requests',
  '/landlord/messages',
  '/landlord/settings',
  '/landlord/help',
  // REALTOR_ASSISTANT_LINKS
  '/realtor/dashboard',
  '/realtor/listings',
  '/realtor/offers',
  '/realtor/leads',
  '/realtor/viewings',
  '/realtor/clients',
  '/realtor/commissions',
  '/realtor/messages',
  '/realtor/documents',
  '/realtor/reviews',
  '/realtor/verification',
  '/realtor/settings',
  '/realtor/help',
  // OWNER_ASSISTANT_LINKS
  '/owner/dashboard',
  '/owner/properties',
  '/owner/listings',
  '/owner/offers',
  '/owner/transactions',
  '/owner/viewings',
  '/owner/realtors',
  '/owner/messages',
  '/owner/documents',
  '/owner/verification',
  '/owner/settings',
  '/owner/help',
];

describe('assistant link routes', () => {
  it.each(SERVER_PATHS)('maps %s to an app screen', (path) => {
    expect(mobileRouteFor(path)).toMatch(/^\/\(app\)\//);
  });

  it('ignores an unknown path', () => {
    expect(mobileRouteFor('https://example.com')).toBeNull();
  });
});
