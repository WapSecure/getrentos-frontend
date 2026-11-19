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

test('an owner opening an application or lease notice stays in the owner portal', () => {
  assert.equal(
    portalLink('owner', '/landlord/applications?application=app-1'),
    '/owner/applications?application=app-1'
  );
  assert.equal(portalLink('owner', '/landlord/leases?status=draft'), '/owner/leases?status=draft');
  assert.equal(portalLink('landlord', '/landlord/applications'), '/landlord/applications');
});

test('a resident opening an office reply lands on their messages', () => {
  assert.equal(portalLink('resident', '/estate/office-messages'), '/resident/messages');
  assert.equal(portalLink('renter', '/estate/office-messages'), '/resident/messages');
  assert.equal(portalLink('estate', '/estate/resident-messages'), '/estate/resident-messages');
});
