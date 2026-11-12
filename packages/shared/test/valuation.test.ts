import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  portfolioValuationSubtitle,
  portfolioValuationView,
  valuationDate,
  valuationNote,
  valuationSentence,
  valuerAndDate,
  type PropertyValuation,
} from '../src/diaspora/valuation.ts';

const valuation = (over: Partial<PropertyValuation> = {}): PropertyValuation => ({
  id: 'v1',
  propertyId: 'p1',
  amount: '95000000',
  method: 'COMPARABLE_SALES',
  methodLabel: 'Comparable sales',
  valuerName: 'Ada Okafor',
  inspectedAt: '2026-05-28T09:00:00.000Z',
  reportDate: '2026-06-01T09:00:00.000Z',
  validUntil: '2027-06-01T09:00:00.000Z',
  outOfDate: false,
  ...over,
});

test('a value is always said with the valuer and the date, never as worth', () => {
  const line = valuationSentence(valuation());
  assert.match(line, /^Valued at ₦\s?95,000,000 by Ada Okafor, 1 June 2026$/);
  assert.doesNotMatch(line, /market value|worth/i);
  assert.equal(valuerAndDate(valuation()), 'Ada Okafor, 1 June 2026');
  assert.equal(valuationDate('2026-11-30T23:30:00.000Z'), '1 December 2026');
});

test('an out-of-date report says so and that it is not counted', () => {
  assert.equal(valuationNote(valuation()), 'Comparable sales method, accredited valuer');
  assert.match(valuationNote(valuation({ outOfDate: true })), /^Out of date/);
});

test('the portfolio view is absent for an older API and never invents a total', () => {
  assert.equal(portfolioValuationView(undefined), null);
  assert.equal(portfolioValuationView({}), null);
  const none = portfolioValuationView({ valuedTotal: null, valuedCount: 0, notValuedCount: 2 });
  assert.deepEqual(none, { total: null, valuedCount: 0, notValuedCount: 2, valuations: [] });
  assert.equal(
    portfolioValuationSubtitle(none!),
    'No report from an accredited valuer in the last 12 months'
  );
});

test('one valuer is named; several are counted; unvalued properties are counted separately', () => {
  const one = portfolioValuationView({
    valuedTotal: '95000000',
    valuedCount: 1,
    notValuedCount: 1,
    valuations: [valuation(), valuation({ id: 'v2', outOfDate: true })],
  })!;
  assert.equal(one.total, 95_000_000);
  assert.equal(portfolioValuationSubtitle(one), 'Ada Okafor, 1 June 2026; 1 not valued');
  const two = portfolioValuationView({
    valuedTotal: '150000000',
    valuedCount: 2,
    notValuedCount: 0,
    valuations: [valuation(), valuation({ id: 'v3', valuerName: 'Bola Ade' })],
  })!;
  assert.equal(portfolioValuationSubtitle(two), '2 reports under 12 months old');
});
