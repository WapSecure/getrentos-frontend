import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareRating, compareVerification } from './compareRows';

const chain = (met: Record<string, boolean>) => ({
  steps: ['owner', 'authority', 'property', 'payment'].map((id) => ({ id, met: met[id] ?? true })),
});

test('verification follows the trust chain, not the bare property flag', () => {
  // The reported case: the property flag is set but two links are outstanding.
  const inProgress = compareVerification({
    verified: true,
    trustChain: chain({ owner: false, authority: false }),
  });
  assert.deepEqual(inProgress, { label: 'Verification in progress', tone: 'pending' });
  assert.equal(
    compareVerification({ verified: true, trustChain: chain({}) }).label,
    'Fully verified'
  );
});

test('verification falls back to the flag only without a chain', () => {
  assert.equal(compareVerification({ verified: true }).label, 'Property verified');
  assert.equal(compareVerification({ verified: false }).label, 'Not verified yet');
});

test('a rating with no reviews behind it reads as no reviews', () => {
  assert.equal(compareRating({ rating: 0, landlordReviews: 0 }), null);
  assert.equal(compareRating({ rating: 0 }), null);
  assert.equal(compareRating({ rating: 4.5, landlordReviews: 0 }), null);
});

test('a rating with reviews shows the score and the count', () => {
  assert.equal(compareRating({ rating: 4.25, landlordReviews: 3 }), '4.3 (3 reviews)');
  assert.equal(compareRating({ rating: 5, landlordReviews: 1 }), '5.0 (1 review)');
  assert.equal(compareRating({ rating: 4 }), '4.0');
});
