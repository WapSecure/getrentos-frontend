import { test } from 'node:test';
import assert from 'node:assert/strict';
import { depositIdentityNotice, identityGate } from './identityGate';

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

test('asks an unverified buyer to verify before paying a deposit, with the link', () => {
  assert.deepEqual(depositIdentityNotice('unverified'), {
    message: 'Verify your identity before you pay a deposit. It takes a few minutes.',
    verifyLink: true,
  });
});

test('tells a buyer in review to wait, without a link', () => {
  const notice = depositIdentityNotice('in_review');
  assert.equal(notice?.verifyLink, false);
  assert.match(notice?.message ?? '', /being reviewed/);
});

test('never blocks a deposit for a verified buyer or a status that has not loaded', () => {
  assert.equal(depositIdentityNotice('verified'), null);
  assert.equal(depositIdentityNotice('unknown'), null);
  assert.equal(depositIdentityNotice(identityGate(undefined)), null);
});
