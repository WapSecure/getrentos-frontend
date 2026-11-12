import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasTrustScore,
  NO_TRUST_SCORE_LABEL,
  trustScoreDisplay,
} from '../src/utils/trustScoreDisplay.ts';

test('zero, missing or invalid scores read as new, never as 0', () => {
  for (const value of [0, null, undefined, Number.NaN, -3]) {
    assert.equal(hasTrustScore(value), false);
    assert.equal(trustScoreDisplay(value), NO_TRUST_SCORE_LABEL);
  }
});

test('a real score shows as a whole number', () => {
  assert.equal(hasTrustScore(24), true);
  assert.equal(trustScoreDisplay(24), '24');
  assert.equal(trustScoreDisplay(71.6), '72');
});
