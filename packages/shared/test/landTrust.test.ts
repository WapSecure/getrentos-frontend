import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LAND_DILIGENCE_LABELS,
  normalizeLandDiligenceStatus,
  VERIFICATION_SUMMARY_STATUS,
  VERIFICATION_SUMMARY_STATUSES,
} from '../src/utils/landTrust.ts';

test('diligence status: any casing or separator, unknown reads as not started', () => {
  assert.equal(normalizeLandDiligenceStatus('in-review'), 'IN_REVIEW');
  assert.equal(normalizeLandDiligenceStatus(' Action required '), 'ACTION_REQUIRED');
  assert.equal(normalizeLandDiligenceStatus('nonsense'), 'NOT_STARTED');
  assert.equal(normalizeLandDiligenceStatus(null), 'NOT_STARTED');
  assert.equal(LAND_DILIGENCE_LABELS.REJECTED, 'Rejected');
});

test('verification summary: every status has copy, and none claims a verified property', () => {
  for (const status of VERIFICATION_SUMMARY_STATUSES) {
    const { label, description } = VERIFICATION_SUMMARY_STATUS[status];
    assert.ok(label && description);
    assert.doesNotMatch(`${label} ${description}`, /verified property|escrow|\bAI\b/i);
  }
  assert.equal(VERIFICATION_SUMMARY_STATUS.INVESTMENT_ELIGIBLE.label, 'Investment eligible');
});
