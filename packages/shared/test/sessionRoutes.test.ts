import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sessionExpiredRedirect } from '../src/auth/sessionRoutes.ts';

const isPublicPath = (pathname: string) => pathname === '/' || pathname.startsWith('/rent/');

test('an ended session on a public page stays put', () => {
  assert.equal(
    sessionExpiredRedirect({ pathname: '/rent/flat-1', search: '' }, '/login', isPublicPath),
    null
  );
});

test('an ended session in a signed-in area goes to sign-in with the way back', () => {
  assert.equal(
    sessionExpiredRedirect(
      { pathname: '/renter/payments', search: '?tab=due' },
      '/login',
      isPublicPath
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
