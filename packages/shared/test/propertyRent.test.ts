import { test } from 'node:test';
import assert from 'node:assert/strict';
import { propertyRentSummary } from '../src/utils/propertyRent.ts';

test('shows the rent roll once a unit is let', () => {
  assert.deepEqual(
    propertyRentSummary({ totalUnits: 2, annualRentRoll: 3_000_000, askingRent: 1 }),
    {
      kind: 'let',
      amount: 3_000_000,
      period: 'year',
    }
  );
});

test('shows the asking rent in its own period when nothing is let', () => {
  assert.deepEqual(
    propertyRentSummary({
      totalUnits: 1,
      annualRentRoll: 0,
      askingRent: 250_000,
      askingRentPeriod: 'month',
    }),
    { kind: 'asking', amount: 250_000, period: 'month', from: false }
  );
});

test('marks the lowest of several asking rents as a starting figure', () => {
  const summary = propertyRentSummary({
    totalUnits: 3,
    annualRentRoll: 0,
    askingRent: 1_500_000,
    askingRentVaries: true,
  });
  assert.deepEqual(summary, { kind: 'asking', amount: 1_500_000, period: 'year', from: true });
});

test('never shows zero rent for a vacant property with no asking rent', () => {
  assert.deepEqual(propertyRentSummary({ totalUnits: 2, annualRentRoll: 0 }), {
    kind: 'none',
    label: 'Not let',
  });
  assert.deepEqual(propertyRentSummary({ totalUnits: 0, annualRentRoll: 0, askingRent: 0 }), {
    kind: 'none',
    label: 'No units yet',
  });
});
