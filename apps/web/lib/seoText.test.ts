import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listingPageTitle, metaDescription, trimToWords } from './seoText';

test('keeps short text as it is', () => {
  assert.equal(trimToWords('  Two  bed flat ', 20), 'Two bed flat');
});

test('cuts long text at a word boundary with an ellipsis', () => {
  const out = trimToWords('A bright three bedroom apartment close to the lagoon', 30);
  assert.ok(out.length <= 30);
  assert.equal(out, 'A bright three bedroom…');
});

test('listing title keeps the location when it fits', () => {
  assert.equal(listingPageTitle('2-Bed Flat', 'Yaba, Lagos'), '2-Bed Flat: Yaba, Lagos');
});

test('listing title drops the location, then trims, to stay within 60 with the suffix', () => {
  const t = listingPageTitle('3-bed apartment in Lekki (test fixture)', 'Lekki, Lagos');
  assert.equal(t, '3-bed apartment in Lekki (test fixture)');
  const long = listingPageTitle('Luxury five bedroom fully detached duplex with boys quarters and pool', 'Ikoyi, Lagos');
  assert.ok(long.length + ' | Sureground'.length <= 60);
});

test('descriptions stay within 155 characters', () => {
  assert.ok(metaDescription('word '.repeat(80)).length <= 155);
});
