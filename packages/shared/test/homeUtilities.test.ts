import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DISCO_LABELS,
  costPerUnitFigure,
  monthSpendBreakdown,
  FUEL_TYPE_LABELS,
  PURCHASE_KIND_LABELS,
  TARIFF_BAND_LABELS,
  TARIFF_BAND_MIN_HOURS,
  UTILITY_KIND_LABELS,
  bandCheck,
  discoLabel,
  formatKwh,
  formatWaterParameters,
  generatorServiceSummary,
  formatLitres,
  generatorServiceLabel,
  isPlausibleMeterNumber,
  maskMeterNumber,
  parseWholeNaira,
  pricePerUnit,
  purchaseQuantityUnit,
  tokenLast4,
  utilityKindForCategory,
} from '../src/homeUtilities/index.ts';

test('masks meter numbers to the last 4 digits', () => {
  assert.equal(maskMeterNumber('4821'), 'Meter ending 4821');
  assert.equal(maskMeterNumber(null), 'No meter number recorded');
});

test('keeps only the last 4 digits of a token, on the device', () => {
  assert.equal(tokenLast4('1234-5678-9012-3456-4821'), '4821');
  assert.equal(tokenLast4('1234 5678 9012 3456 7890'), '7890');
  assert.equal(tokenLast4('482'), null);
  assert.equal(tokenLast4(''), null);
  assert.equal(tokenLast4(undefined), null);
});

test('accepts 11 to 13 digit meter numbers only', () => {
  assert.equal(isPlausibleMeterNumber('0101 2345 678'), true);
  assert.equal(isPlausibleMeterNumber('45-0123-4567-89'), true);
  assert.equal(isPlausibleMeterNumber('1234567890'), false);
  assert.equal(isPlausibleMeterNumber('12345678901234'), false);
  assert.equal(isPlausibleMeterNumber(null), false);
});

test('band labels carry the minimum hours', () => {
  assert.equal(TARIFF_BAND_LABELS.A, 'Band A (at least 20 hours a day)');
  assert.deepEqual(TARIFF_BAND_MIN_HOURS, { A: 20, B: 16, C: 12, D: 8, E: 4 });
});

test('band check says "no supply logged" rather than treating nothing as zero', () => {
  assert.equal(bandCheck(null, 'A').status, 'NO_DATA');
  assert.equal(bandCheck(21, 'A').status, 'MEETS');
  const below = bandCheck(14.5, 'B');
  assert.equal(below.status, 'BELOW');
  assert.match(below.message, /below the 16 hours Band B promises/);
  assert.equal(bandCheck(10, null).status, 'NO_BAND');
});

test('generator service lines read plainly', () => {
  assert.equal(
    generatorServiceLabel({ state: 'OK', hoursRemaining: 42, daysRemaining: null, dueBy: 'HOURS' }),
    'Service due in 42 running hours'
  );
  assert.equal(
    generatorServiceLabel({
      state: 'DUE_SOON',
      hoursRemaining: 1,
      daysRemaining: 9,
      dueBy: 'HOURS',
    }),
    'Service due in 1 running hour or 9 days'
  );
  assert.equal(
    generatorServiceLabel({
      state: 'DUE',
      hoursRemaining: -12,
      daysRemaining: null,
      dueBy: 'HOURS',
    }),
    'Service overdue by 12 running hours'
  );
  assert.equal(
    generatorServiceLabel({ state: 'DUE', hoursRemaining: 30, daysRemaining: -3, dueBy: 'DAYS' }),
    'Service overdue by 3 days'
  );
  assert.equal(
    generatorServiceLabel({
      state: 'NO_BASELINE',
      hoursRemaining: null,
      daysRemaining: null,
      dueBy: null,
    }),
    'Record a service to start counting'
  );
});

test('price per unit is whole naira, or nothing without a quantity', () => {
  assert.equal(pricePerUnit(180_000, 150), 1200);
  assert.equal(pricePerUnit(20_000, 0), null);
  assert.equal(pricePerUnit(20_000, null), null);
  assert.equal(formatLitres(150), '150 litres');
  assert.equal(formatLitres(1), '1 litre');
  assert.equal(formatKwh(68.5), '68.5 kWh');
  assert.equal(purchaseQuantityUnit('ELECTRICITY_BILL'), null);
  assert.equal(purchaseQuantityUnit('WATER_TANKER'), 'litres');
});

test('typed amounts must be whole naira', () => {
  assert.equal(parseWholeNaira('₦180,000'), 180_000);
  assert.equal(parseWholeNaira('199.50'), null);
  assert.equal(parseWholeNaira('0'), null);
  assert.equal(parseWholeNaira('abc'), null);
});

test('a named DisCo replaces "Another company"', () => {
  assert.equal(discoLabel('OTHER', 'Lagos State Electricity'), 'Lagos State Electricity');
  assert.equal(discoLabel('IKEJA'), 'Ikeja Electric');
});

test('labels are plain British copy: no em dashes, no dollar signs', () => {
  const text = JSON.stringify([
    UTILITY_KIND_LABELS,
    FUEL_TYPE_LABELS,
    DISCO_LABELS,
    TARIFF_BAND_LABELS,
    PURCHASE_KIND_LABELS,
  ]);
  assert.doesNotMatch(text, /—/);
  assert.doesNotMatch(text, /\$/);
});

test('common asset categories imply their utility type', () => {
  assert.equal(utilityKindForCategory('Generator'), 'GENERATOR');
  assert.equal(utilityKindForCategory('Water treatment unit'), 'WATER_TREATMENT');
  assert.equal(utilityKindForCategory('Air conditioner'), null);
});

test('utility tiles appear only once something has been recorded', async () => {
  const { shouldShowUtilityTiles } = await import('../src/homeUtilities/index.ts');
  assert.equal(shouldShowUtilityTiles(undefined), false);
  assert.equal(shouldShowUtilityTiles(null), false);
  const base = {
    propertyId: null,
    month: '2026-11',
    monthLabel: 'November 2026',
    spendThisMonth: null,
    entriesThisMonth: 0,
    dieselLitresThisMonth: null,
    dieselSpendThisMonth: null,
    generatorsTotal: 0,
    generatorsDue: 0,
    generatorsDueSoon: 0,
    waterTestsFailedRecently: 0,
  };
  assert.equal(shouldShowUtilityTiles({ ...base, hasUtilityData: false }), false);
  assert.equal(shouldShowUtilityTiles({ ...base, hasUtilityData: true }), true);
});

test('nothing recorded reads "No data yet", never ₦0', async () => {
  const { formatSpendOrNoData } = await import('../src/homeUtilities/index.ts');
  assert.equal(formatSpendOrNoData(null), 'No data yet');
  assert.equal(formatSpendOrNoData(undefined, 'None'), 'None');
  assert.match(formatSpendOrNoData(0), /0/);
  assert.match(formatSpendOrNoData(180000), /180,000/);
});

test('months are Lagos months and windows count back from this month', async () => {
  const { lagosMonthKey, monthsBackFrom } = await import('../src/homeUtilities/index.ts');
  assert.equal(lagosMonthKey(new Date('2026-10-31T23:30:00Z')), '2026-11');
  assert.equal(monthsBackFrom(12, new Date('2026-11-13T12:00:00Z')), '2025-12');
  assert.equal(monthsBackFrom(1, new Date('2026-11-13T12:00:00Z')), '2026-11');
});

test('water readings read as names and units, never field keys', () => {
  assert.equal(
    formatWaterParameters({ pH: 5.9, tdsMgL: 620, ironMgL: 1.2, coliforms: 'Present' }),
    'pH 5.9, Dissolved solids 620 mg/L, Iron 1.2 mg/L, Coliforms Present'
  );
  assert.equal(formatWaterParameters({ nitrateMgL: 4, iron: null }), 'nitrateMgL 4');
  assert.equal(formatWaterParameters(null), '');
});

test('a generator that is nearly due is never summarised as 0', () => {
  assert.equal(generatorServiceSummary(0, 0), '0');
  assert.equal(generatorServiceSummary(0, 1), '1 due soon');
  assert.equal(generatorServiceSummary(2, 0), '2');
  assert.equal(generatorServiceSummary(1, 2), '1 due, 2 soon');
});

test('cost per unit is shown for one property only, and says why when missing', () => {
  assert.equal(costPerUnitFigure({ costPerUnit: 5000, unitsCount: 4 }, false).value, 'One property at a time');
  assert.equal(costPerUnitFigure({ costPerUnit: null, unitsCount: 0 }, true).hint, 'Add units to the property to see this');
  const one = costPerUnitFigure({ costPerUnit: 5000, unitsCount: 1 }, true);
  assert.match(one.value, /5,000/);
  assert.equal(one.hint, 'Across 1 unit');
});

test('a month breakdown lists recorded categories, largest first, and skips gaps', () => {
  const text = monthSpendBreakdown({
    fuel: { amount: 120000, quantity: 100, entries: 1 },
    electricity: { amount: 20000, quantity: null, entries: 1 },
    water: null,
    repairs: { amount: 45000, quantity: null, entries: 1 },
  });
  assert.match(text, /^Fuel .*120,000, Utility repairs .*45,000, Electricity .*20,000$/);
  assert.equal(monthSpendBreakdown({ fuel: null, electricity: null, water: null, repairs: null }), '');
});
