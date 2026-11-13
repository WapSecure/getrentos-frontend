import { test } from 'node:test';
import assert from 'node:assert/strict';
import { homeManagementTabHref, parseHomeManagementTab } from './homeManagementTabs';

test('a known tab is read from the URL', () => {
  assert.equal(parseHomeManagementTab('work-orders'), 'work-orders');
  assert.equal(parseHomeManagementTab('history'), 'history');
});

test('a missing or unknown tab opens the overview', () => {
  assert.equal(parseHomeManagementTab(null), 'overview');
  assert.equal(parseHomeManagementTab(undefined), 'overview');
  assert.equal(parseHomeManagementTab(''), 'overview');
  assert.equal(parseHomeManagementTab('home-management'), 'overview');
});

test('a tab link sets the parameter and the overview removes it', () => {
  assert.equal(
    homeManagementTabHref('/owner/home-management', '', 'assets'),
    '/owner/home-management?tab=assets'
  );
  assert.equal(
    homeManagementTabHref('/owner/home-management', 'tab=assets', 'overview'),
    '/owner/home-management'
  );
});

test('other query parameters survive, including a hub tab under a different name', () => {
  assert.equal(
    homeManagementTabHref(
      '/landlord/maintenance',
      'tab=home-management',
      'preventive-care',
      'section'
    ),
    '/landlord/maintenance?tab=home-management&section=preventive-care'
  );
  assert.equal(
    homeManagementTabHref(
      '/landlord/maintenance',
      'tab=home-management&section=assets',
      'overview',
      'section'
    ),
    '/landlord/maintenance?tab=home-management'
  );
});
