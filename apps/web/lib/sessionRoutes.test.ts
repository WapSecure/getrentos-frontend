import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sessionExpiredRedirect } from '@sureground/shared';
import { isPublicWebPath } from './sessionRoutes';

test('marketing and listing pages are public', () => {
  for (const path of [
    '/',
    '/sell',
    '/rent',
    '/rent/',
    '/rent/3-bed-flat-lekki-abc123',
    '/buy',
    '/buy/some-home',
    '/landlords',
    '/renters',
    '/buyers',
    '/agents',
    '/estates',
    '/about',
    '/pricing',
    '/resources',
    '/resources/how-to-rent',
    '/areas/lekki',
    '/shortlets/xyz',
    '/collections/lagos-picks',
    '/l/some-listing',
    '/e/some-estate',
    '/land',
    '/land/plot-in-epe-123',
    '/land/market',
    '/land/layouts/42',
    '/developments',
    '/developments/0b6c7a52-6d1b-4f0e-9a51-3f1f7e0d9c11',
    '/diaspora',
    '/diaspora/transparency',
    '/home-management',
    '/detty-december',
    '/privacy',
    '/terms',
    '/cookies',
    '/signup',
    '/forgot-password',
  ]) {
    assert.equal(isPublicWebPath(path), true, path);
  }
});

test('dashboards and other signed-in areas are not public', () => {
  for (const path of [
    '/owner',
    '/owner/dashboard',
    '/owner/invest/managed',
    '/landlord',
    '/landlord/properties',
    '/buyer/dashboard',
    '/renter',
    '/renter/applications',
    '/realtor/dashboard',
    '/agent/dashboard',
    '/agency',
    '/agency/team',
    '/estate/billing',
    '/gateman/verify',
    '/resident/dues',
    '/admin',
    '/admin/dashboard',
    '/dashboard',
    '/billing/return',
    '/payments/return',
    '/representing',
    '/representing/transactions/1',
    '/role-selection',
    '/agency-invite/claim',
    '/land/watch',
    '/land/disputes/abc',
    '/land/representing/purchases/1',
    '/land/dossier/listing/1',
    '/land/reviews/accreditation',
  ]) {
    assert.equal(isPublicWebPath(path), false, path);
  }
});

test('a role prefix does not swallow the public page that shares its start', () => {
  assert.equal(isPublicWebPath('/agents'), true);
  assert.equal(isPublicWebPath('/estates'), true);
  assert.equal(isPublicWebPath('/landlords'), true);
  assert.equal(isPublicWebPath('/renters'), true);
  assert.equal(isPublicWebPath('/buyers'), true);
  assert.equal(isPublicWebPath('/rental'), true);
});

test('an ended session on /sell stays put; on a dashboard it goes to sign-in', () => {
  assert.equal(
    sessionExpiredRedirect({ pathname: '/sell', search: '' }, '/login', isPublicWebPath),
    null
  );
  assert.equal(
    sessionExpiredRedirect({ pathname: '/owner/dashboard', search: '' }, '/login', isPublicWebPath),
    '/login?reason=session_expired&next=%2Fowner%2Fdashboard'
  );
});
