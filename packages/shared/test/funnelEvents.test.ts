import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coarseUtmValue, referrerHostOf, searchFilterProps } from '../src/showroom/funnelEvents.ts';

test('searchFilterProps keeps only known keys, sorted and unique', () => {
  assert.deepEqual(searchFilterProps(['max_price', 'query', 'bedrooms', 'query', 'lekki']), {
    filters: 'bedrooms,max_price,query',
    filterCount: 3,
  });
  assert.deepEqual(searchFilterProps([]), { filterCount: 0 });
});

test('coarseUtmValue lowercases, strips odd characters and drops phone-like values', () => {
  assert.equal(coarseUtmValue('Detty December 2026!'), 'detty_december_2026');
  assert.equal(coarseUtmValue('x'.repeat(80))?.length, 60);
  assert.equal(coarseUtmValue('call-08012345678'), null);
  assert.equal(coarseUtmValue('   '), null);
  assert.equal(coarseUtmValue(null), null);
});

test('referrerHostOf keeps only another site host', () => {
  assert.equal(
    referrerHostOf('https://www.google.com/search?q=flat+in+lekki', 'sureground.ng'),
    'google.com'
  );
  assert.equal(referrerHostOf('https://sureground.ng/rent', 'www.sureground.ng'), null);
  assert.equal(referrerHostOf('', 'sureground.ng'), null);
  assert.equal(referrerHostOf('not a url', 'sureground.ng'), null);
  assert.equal(referrerHostOf('http://localhost:3000/', 'sureground.ng'), null);
});
