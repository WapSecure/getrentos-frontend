import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HOME_MANAGEMENT_TABS,
  homeManagementTabHref,
  parseHomeManagementTab,
  parseUtilitiesView,
  utilitiesViewHref,
} from './homeManagementTabs';

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

test('utilities sits between assets and service standards', () => {
  assert.equal(parseHomeManagementTab('utilities'), 'utilities');
  const tabs = [...HOME_MANAGEMENT_TABS];
  assert.equal(tabs.indexOf('utilities'), tabs.indexOf('assets') + 1);
  assert.equal(tabs.indexOf('service-standards'), tabs.indexOf('utilities') + 1);
});

test('the utilities view defaults to power and ignores unknown values', () => {
  assert.equal(parseUtilitiesView('water'), 'water');
  assert.equal(parseUtilitiesView('spend'), 'spend');
  assert.equal(parseUtilitiesView('service-charge'), 'service-charge');
  assert.equal(parseUtilitiesView(null), 'power');
  assert.equal(parseUtilitiesView('not-a-view'), 'power');
  assert.equal(
    utilitiesViewHref('/owner/home-management', 'tab=utilities', 'water'),
    '/owner/home-management?tab=utilities&view=water'
  );
  assert.equal(
    utilitiesViewHref('/owner/home-management', 'tab=utilities&view=water', 'power'),
    '/owner/home-management?tab=utilities'
  );
});

test('leaving Utilities drops its sub-view; staying keeps it', () => {
  assert.equal(
    homeManagementTabHref('/owner/home-management', 'tab=utilities&view=water', 'work-orders'),
    '/owner/home-management?tab=work-orders'
  );
  assert.equal(
    homeManagementTabHref('/owner/home-management', 'tab=assets&view=spend', 'utilities'),
    '/owner/home-management?tab=utilities&view=spend'
  );
});
