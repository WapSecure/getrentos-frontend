import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isListingVerified,
  listingVerification,
  trustChainLabel,
} from '../src/utils/trustLabel.ts';

const chain = (met: Record<string, boolean>) => ({
  steps: ['owner', 'authority', 'property', 'payment'].map((id) => ({
    id,
    met: id === 'payment' ? true : !!met[id],
  })),
});

test('fully verified only when every check is done', () => {
  assert.deepEqual(trustChainLabel(chain({ owner: true, authority: true, property: true })), {
    label: 'Fully verified',
    tone: 'verified',
  });
});

test('never says verified while the property check is outstanding', () => {
  for (const met of [{ owner: true, authority: true }, { owner: true }, {}]) {
    assert.deepEqual(trustChainLabel(chain(met)), {
      label: 'Verification in progress',
      tone: 'pending',
    });
    assert.equal(isListingVerified({ trustChain: chain(met), verified: true }), false);
  }
});

test('a verified property names what is still to come', () => {
  assert.equal(
    trustChainLabel(chain({ owner: true, property: true })).label,
    'Verified · ownership pending'
  );
  assert.equal(
    trustChainLabel(chain({ authority: true, property: true })).label,
    'Verified · owner ID pending'
  );
});

test('a verified property with owner ID and ownership both open is still in progress', () => {
  // The demo listing: web read the bare flag (Verified listing), mobile the chain (Verifying).
  assert.deepEqual(trustChainLabel(chain({ property: true })), {
    label: 'Verification in progress',
    tone: 'pending',
  });
  assert.equal(isListingVerified({ trustChain: chain({ property: true }), verified: true }), false);
});

test('the trust chain wins over a bare flag that disagrees', () => {
  assert.equal(
    isListingVerified({ trustChain: chain({ owner: true, property: true }), verified: false }),
    true
  );
  assert.equal(isListingVerified({ trustChain: chain({ owner: true }), isVerified: true }), false);
});

test('falls back to the flag without a trust chain', () => {
  assert.deepEqual(listingVerification({ verified: true }), {
    verified: true,
    label: 'Verified',
    tone: 'verified',
  });
  assert.equal(isListingVerified({ isVerified: true, trustChain: { steps: [] } }), true);
  assert.equal(listingVerification({}).verified, false);
  assert.equal(listingVerification({ trustChain: null, verified: false }).tone, 'pending');
});

test('approval with conditions is never verified, whatever the chain or flag says', () => {
  const fullChain = chain({ owner: true, authority: true, property: true });
  for (const listing of [
    { isVerified: true, diligence: { status: 'CONDITIONAL' } },
    { verified: true, verificationSummary: { status: 'CONDITIONALLY_APPROVED' } },
    // A stale chain that still shows every link met.
    { trustChain: fullChain, verificationSummary: { status: 'CONDITIONALLY_APPROVED' } },
    { trustChain: fullChain, diligence: { status: 'conditional' } },
  ]) {
    assert.equal(isListingVerified(listing), false);
    assert.deepEqual(listingVerification(listing), {
      verified: false,
      label: 'Approved with conditions',
      tone: 'pending',
    });
  }
});

test('unconditional approval still reads as verified', () => {
  assert.equal(isListingVerified({ isVerified: true, diligence: { status: 'VERIFIED' } }), true);
  assert.equal(
    isListingVerified({
      trustChain: chain({ owner: true, authority: true, property: true }),
      verificationSummary: { status: 'INVESTMENT_ELIGIBLE' },
    }),
    true
  );
});
