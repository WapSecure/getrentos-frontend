import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPublicWebPath, sessionExpiredRedirect } from '../src/auth/sessionRoutes.ts';

test('listing and marketing pages are public', () => {
  for (const path of [
    '/',
    '/rent',
    '/rent/3-bed-flat-lekki-abc123',
    '/buy/some-home',
    '/shortlets/xyz',
    '/collections/lagos-picks',
    '/land',
    '/land/plot-in-epe-123',
    '/land/market',
    '/land/layouts/42',
    '/rent/',
    '/developments',
    '/developments/0b6c7a52-6d1b-4f0e-9a51-3f1f7e0d9c11',
  ]) {
    assert.equal(isPublicWebPath(path), true, path);
  }
});

test('dashboards and signed-in land pages are not public', () => {
  for (const path of [
    '/renter',
    '/renter/applications',
    '/landlord/properties',
    '/dashboard',
    '/billing/return',
    '/land/watch',
    '/land/disputes/abc',
    '/land/representing/purchases/1',
    '/land/dossier/listing/1',
    '/rental',
    '/landlord',
  ]) {
    assert.equal(isPublicWebPath(path), false, path);
  }
});

test('an ended session on a public page stays put', () => {
  assert.equal(
    sessionExpiredRedirect({ pathname: '/rent/flat-1', search: '' }, '/login', isPublicWebPath),
    null
  );
});

test('an ended session in a signed-in area goes to sign-in with the way back', () => {
  assert.equal(
    sessionExpiredRedirect(
      { pathname: '/renter/payments', search: '?tab=due' },
      '/login',
      isPublicWebPath
    ),
    '/login?reason=session_expired&next=%2Frenter%2Fpayments%3Ftab%3Ddue'
  );
});

test('without a public list every page redirects, except sign-in itself', () => {
  assert.equal(
    sessionExpiredRedirect({ pathname: '/', search: '' }, '/admin/login'),
    '/admin/login?reason=session_expired&next=%2F'
  );
  assert.equal(
    sessionExpiredRedirect({ pathname: '/admin/login', search: '' }, '/admin/login'),
    null
  );
});
