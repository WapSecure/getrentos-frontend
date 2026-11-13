import { test } from 'node:test';
import assert from 'node:assert/strict';
import { portalLink } from './portalLinks';
import { ownerViewingTab } from './ownerViewingTabs';

test('an owner opening a rental viewing request lands on the renters tab', () => {
  assert.equal(portalLink('owner', '/landlord/viewing-requests'), '/owner/viewings?tab=renters');
  assert.equal(portalLink('owner', '/landlord/viewing-requests/'), '/owner/viewings?tab=renters');
});

test('query strings survive the rewrite', () => {
  assert.equal(
    portalLink('owner', '/landlord/viewing-requests?id=vr-1'),
    '/owner/viewings?tab=renters&id=vr-1'
  );
});

test('landlords keep their own link', () => {
  assert.equal(portalLink('landlord', '/landlord/viewing-requests'), '/landlord/viewing-requests');
});

test('unmapped links pass through untouched', () => {
  assert.equal(portalLink('owner', '/owner/offers'), '/owner/offers');
  assert.equal(
    portalLink('owner', '/landlord/viewing-requests-archive'),
    '/landlord/viewing-requests-archive'
  );
  assert.equal(portalLink('renter', '/renter/viewings'), '/renter/viewings');
});

test('owner viewing tab defaults to buyers and accepts renters', () => {
  assert.equal(ownerViewingTab('renters'), 'renters');
  assert.equal(ownerViewingTab('buyers'), 'buyers');
  assert.equal(ownerViewingTab(null), 'buyers');
  assert.equal(ownerViewingTab('nonsense'), 'buyers');
});
