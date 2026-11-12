import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signedInPricingLinks } from './pricingCta';

test('sends a landlord to their dashboard and billing page', () => {
  assert.deepEqual(signedInPricingLinks('landlord'), {
    dashboard: '/landlord/dashboard',
    billing: '/landlord/billing',
  });
});

test('offers billing to every role that has a billing page', () => {
  for (const role of ['owner', 'realtor', 'estate']) {
    assert.equal(signedInPricingLinks(role).billing, `/${role}/billing`);
  }
});

test('offers only the dashboard to roles without a billing page', () => {
  const links = signedInPricingLinks('buyer');
  assert.equal(links.billing, undefined);
  assert.ok(links.dashboard.startsWith('/buyer'));
});

test('treats a missing role as a renter', () => {
  const links = signedInPricingLinks(null);
  assert.equal(links.billing, undefined);
  assert.ok(links.dashboard.startsWith('/renter'));
});
