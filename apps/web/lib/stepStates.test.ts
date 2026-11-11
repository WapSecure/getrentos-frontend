import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stepStates } from './stepStates';

const ESCROW = ['deposit_pending', 'funds_held', 'released'];

test('marks earlier steps done and the active one current', () => {
  assert.deepEqual(stepStates(ESCROW, 'funds_held'), ['done', 'current', 'pending']);
  assert.deepEqual(stepStates(ESCROW, 'deposit_pending'), ['current', 'pending', 'pending']);
});

test('reaching the last step finishes every step', () => {
  assert.deepEqual(stepStates(ESCROW, 'released'), ['done', 'done', 'done']);
});

test('an unknown status reaches no step', () => {
  assert.deepEqual(stepStates(ESCROW, 'frozen'), ['pending', 'pending', 'pending']);
});

test('a stopped process marks every step the same way', () => {
  assert.deepEqual(stepStates(ESCROW, 'frozen', 'blocked'), ['blocked', 'blocked', 'blocked']);
  assert.deepEqual(stepStates(ESCROW, 'refunded', 'skipped'), ['skipped', 'skipped', 'skipped']);
});
