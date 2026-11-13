import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countRentCharges, leaseRentLabel, leaseRentSuffix } from './leaseTerm';

const START = '2026-01-01';
const END = '2026-12-31';

test('a stated period always wins', () => {
  assert.equal(leaseRentLabel('month', START, END), 'Monthly rent');
  assert.equal(leaseRentLabel('year', START, END, 12), 'Annual rent');
});

test('a one-year lease with monthly rent charges is not labelled annual rent', () => {
  const payments = Array.from({ length: 12 }, () => ({ amount: 200_000 }));
  const count = countRentCharges(200_000, [...payments, { amount: 400_000 }]);
  assert.equal(count, 12);
  assert.equal(leaseRentLabel(undefined, START, END, count), 'Monthly rent');
  assert.equal(leaseRentSuffix(undefined, START, END, count), '/mo');
});

test('a one-year lease with a single rent charge still reads as annual rent', () => {
  assert.equal(leaseRentLabel(undefined, START, END, 1), 'Annual rent');
  // Annual rent plus a deposit of the same amount.
  assert.equal(leaseRentLabel(undefined, START, END, 2), 'Annual rent');
  assert.equal(leaseRentLabel(undefined, START, END), 'Annual rent');
});
