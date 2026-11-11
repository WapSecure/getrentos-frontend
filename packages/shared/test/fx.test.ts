import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  indicativeAmount,
  indicativeRateLabel,
  isIndicativeCurrency,
  roundIndicative,
} from '../src/utils/fx.ts';

test('rounds to two significant figures in whole units, half up', () => {
  assert.equal(roundIndicative(82_345), 82_000);
  assert.equal(roundIndicative(8_250), 8_300);
  assert.equal(roundIndicative(124_999), 120_000);
  assert.equal(roundIndicative(125_000), 130_000);
  assert.equal(roundIndicative(947), 950);
  assert.equal(roundIndicative(99.6), 100);
  assert.equal(roundIndicative(3.4), 3);
  assert.equal(roundIndicative(1_234_567), 1_200_000);
  assert.equal(roundIndicative(0), 0);
  assert.equal(roundIndicative(-5), 0);
  assert.equal(roundIndicative(Number.NaN), 0);
});

// Illustrative rate for the maths only, not a real one: 1 NGN = 0.0005 GBP.
const RATE = 0.0005;

test('formats "about £82,000" with en-GB symbols', () => {
  assert.deepEqual(indicativeAmount(164_690_000, RATE, 'GBP'), {
    amount: 82_000,
    currency: 'GBP',
    text: 'about £82,000',
  });
  assert.equal(indicativeAmount(164_690_000, RATE, 'EUR')?.text, 'about €82,000');
  assert.equal(indicativeAmount(164_690_000, RATE, 'USD')?.text, 'about US$82,000');
  assert.equal(indicativeAmount(164_690_000, RATE, 'CAD')?.text, 'about CA$82,000');
});

test('takes naira as a number, a digit string or a bigint', () => {
  assert.equal(indicativeAmount('164690000', RATE, 'GBP')?.amount, 82_000);
  assert.equal(indicativeAmount(164_690_000n, RATE, 'GBP')?.amount, 82_000);
  assert.equal(
    indicativeAmount('90071992547409930000', RATE, 'GBP')?.amount,
    45_000_000_000_000_000
  );
  assert.equal(indicativeAmount('12abc', RATE, 'GBP'), null);
});

test('gives nothing without an honest figure', () => {
  assert.equal(indicativeAmount(800, RATE, 'GBP'), null, 'under one unit');
  assert.equal(indicativeAmount(0, RATE, 'GBP'), null);
  assert.equal(indicativeAmount(1_000_000, 0, 'GBP'), null);
  assert.equal(indicativeAmount(1_000_000, undefined, 'GBP'), null);
  assert.equal(indicativeAmount(1_000_000, Number.NaN, 'GBP'), null);
  assert.equal(indicativeAmount(1_000_000, RATE, 'NGN'), null);
  assert.equal(indicativeAmount(1_000_000, RATE, 'JPY'), null);
});

test('labels the source, Lagos time and day, and that payment is in naira', () => {
  // 13:05 UTC is 14:05 in Lagos (UTC+1, no daylight saving).
  assert.equal(
    indicativeRateLabel('Open Exchange Rates', '2026-11-11T13:05:00Z'),
    'Indicative, Open Exchange Rates rate at 14:05 Lagos, 11 Nov. You pay in naira.'
  );
  // 23:30 UTC is already the next day in Lagos.
  assert.equal(
    indicativeRateLabel('Open Exchange Rates', new Date('2026-11-11T23:30:00Z')),
    'Indicative, Open Exchange Rates rate at 00:30 Lagos, 12 Nov. You pay in naira.'
  );
  assert.equal(indicativeRateLabel('Open Exchange Rates', 'not a date'), null);
  assert.equal(indicativeRateLabel(' ', '2026-11-11T13:05:00Z'), null);
});

test('knows the four indicative currencies only', () => {
  assert.ok(isIndicativeCurrency('GBP'));
  assert.ok(!isIndicativeCurrency('NGN'));
  assert.ok(!isIndicativeCurrency(undefined));
});
