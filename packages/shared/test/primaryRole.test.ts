import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDashboardRoute, resolvePrimaryRoleId } from '../src/auth/constants.ts';

test('an estate manager who is also a gateman lands on the estate dashboard', () => {
  for (const roles of [
    ['ESTATE_MANAGER', 'GATEMAN'],
    ['GATEMAN', 'ESTATE_MANAGER'],
    ['RENTER', 'GATEMAN', 'ESTATE_MANAGER'],
  ]) {
    assert.equal(resolvePrimaryRoleId(roles), 'estate');
    assert.equal(getDashboardRoute(resolvePrimaryRoleId(roles)), '/estate/dashboard');
  }
});

test('a gate guard still starts at the gate console, not their sign-up role', () => {
  assert.equal(resolvePrimaryRoleId(['RENTER', 'GATEMAN']), 'gateman');
  assert.equal(getDashboardRoute('gateman'), '/gateman/verify');
});

test('otherwise the first role the web has a portal for wins', () => {
  assert.equal(resolvePrimaryRoleId(['LANDLORD', 'RENTER']), 'landlord');
  assert.equal(resolvePrimaryRoleId(['UNKNOWN', 'PROPERTY_BUYER']), 'buyer');
  assert.equal(resolvePrimaryRoleId([]), 'renter');
  assert.equal(resolvePrimaryRoleId(null), 'renter');
});
