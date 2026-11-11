import { test } from 'node:test';
import assert from 'node:assert/strict';
import { milestoneStates, stepStates } from './stepStates';
import { singleCurrent } from '../../../packages/ui/src/timelineStates';

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

test('only the earliest delivered milestone is current', () => {
  assert.deepEqual(milestoneStates(['CONFIRMED', 'DELIVERED', 'DELIVERED', 'PENDING']), [
    'done',
    'current',
    'pending',
    'pending',
  ]);
});

test('with nothing delivered, the first undelivered milestone is current', () => {
  assert.deepEqual(milestoneStates(['CONFIRMED', 'WAIVED', 'DISPUTED', 'PENDING', 'PENDING']), [
    'done',
    'skipped',
    'blocked',
    'current',
    'pending',
  ]);
  assert.deepEqual(milestoneStates(['CONFIRMED', 'CONFIRMED']), ['done', 'done']);
});

test('Timeline keeps only the first current item and reports the extras', () => {
  let reported = 0;
  const items = [
    { id: 'a', state: 'done' as const },
    { id: 'b', state: 'current' as const },
    { id: 'c', state: 'current' as const },
  ];
  const out = singleCurrent(items, (count) => {
    reported = count;
  });
  assert.deepEqual(
    out.map((item) => item.state),
    ['done', 'current', 'pending']
  );
  assert.equal(reported, 2);
  assert.deepEqual(
    singleCurrent([{ state: 'current' as const }], () => assert.fail('no warning expected')).map(
      (item) => item.state
    ),
    ['current']
  );
});
