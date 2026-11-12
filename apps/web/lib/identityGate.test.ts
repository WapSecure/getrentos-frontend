import { test } from 'node:test';
import assert from 'node:assert/strict';
import { identityGate } from './identityGate';

test('stays unknown until the status loads', () => {
  assert.equal(identityGate(undefined), 'unknown');
});

test('trusts the identityVerified flag over everything else', () => {
  assert.equal(identityGate({ identityVerified: true, isVerified: false }), 'verified');
  assert.equal(identityGate({ identityVerified: false, isVerified: true, tier: 3 }), 'unverified');
});

test('falls back to tier 2 or the legacy flag', () => {
  assert.equal(identityGate({ isVerified: false, tier: 2 }), 'verified');
  assert.equal(identityGate({ isVerified: true }), 'verified');
  assert.equal(identityGate({ isVerified: false, tier: 1 }), 'unverified');
});

test('reports a check that is still being reviewed', () => {
  const identity = { id: 'k1', status: 'PENDING_REVIEW' } as never;
  assert.equal(identityGate({ identityVerified: false, isVerified: false, identity }), 'in_review');
});
