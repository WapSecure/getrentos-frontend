import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  chargesLateFee,
  lateFeeAfterGrace,
  lateFeeSentence,
  lateFeeValue,
} from '../src/utils/landLateFee.ts';

test('says "No late fee" rather than "0% late fee"', () => {
  assert.equal(chargesLateFee(0), false);
  assert.equal(lateFeeValue(0), 'None');
  assert.equal(lateFeeAfterGrace(0, 7), 'no late fee');
  assert.equal(lateFeeSentence(0, 7), 'No late fee.');
  assert.equal(lateFeeSentence(undefined, 7), 'No late fee.');
});

test('states the fee and the grace when there is one', () => {
  assert.equal(lateFeeValue(500), '5%');
  assert.equal(lateFeeAfterGrace(250, 1), '2.5% late fee after 1 day’s grace');
  assert.equal(lateFeeSentence(500, 14), '14 days’ grace on each instalment, then a 5% late fee.');
});
