import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analysisDefault, analysisInput, percent, SOURCE_LABEL } from './listingAnalysis';

const figure = (value: number | null) => ({
  value,
  source: 'YOUR_ASSUMPTION' as const,
  basis: 'x',
  asOf: '2026-11-12T10:00:00.000Z',
  methodologyVersion: 'v',
});

test('only edits that read as numbers in range are sent', () => {
  assert.deepEqual(
    analysisInput({
      annualRent: '6000000.4',
      vacancyPct: '10',
      rentGrowthPct: '-5',
      maintenancePct: '',
      managementFeePct: 'abc',
      legalFeesPct: '150',
      agencyFeePct: '2.346',
    }),
    { annualRent: 6_000_000, vacancyPct: 10, rentGrowthPct: -5, agencyFeePct: 2.35 }
  );
  assert.deepEqual(analysisInput({}), {});
});

test('defaults come from the assumptions and the fee lines', () => {
  const analysis = {
    assumptions: {
      annualRent: figure(6_000_000),
      vacancyPct: figure(16.7),
      rentGrowthPct: figure(0),
      maintenancePct: figure(0),
      managementFeePct: figure(10),
    },
    costs: [
      { key: 'PURCHASE_PRICE', ratePct: null },
      { key: 'LEGAL_FEES', ratePct: figure(7.5) },
      { key: 'AGENCY_FEE', ratePct: figure(7.5) },
      { key: 'CONSENT_AND_REGISTRATION', ratePct: figure(3) },
    ],
  } as never;
  assert.equal(analysisDefault(analysis, 'annualRent'), '6000000');
  assert.equal(analysisDefault(analysis, 'rentGrowthPct'), '0');
  assert.equal(analysisDefault(analysis, 'consentPct'), '3');
  const noRent = {
    assumptions: { annualRent: figure(null) },
    costs: [],
  } as never;
  assert.equal(analysisDefault(noRent, 'annualRent'), '');
  assert.equal(analysisDefault(noRent, 'legalFeesPct'), '');
});

test('labels and percentages read plainly', () => {
  assert.equal(SOURCE_LABEL.THIRD_PARTY_ESTIMATE, 'Third-party estimate');
  assert.equal(percent(5.1), '5.1%');
  assert.equal(percent(null), '—');
});
