import { test } from 'node:test';
import assert from 'node:assert/strict';
import { routeTemplate } from './routeTemplate';

test('replaces dynamic params with their names', () => {
  assert.equal(routeTemplate('/rent/abc123', { id: 'abc123' }), '/rent/[id]');
  assert.equal(routeTemplate('/areas/lekki/rent', { area: 'lekki' }), '/areas/[area]/rent');
  assert.equal(routeTemplate('/', {}), '/');
});

test('collapses a catch-all into one segment', () => {
  assert.equal(routeTemplate('/docs/a/b/c', { slug: ['a', 'b', 'c'] }), '/docs/[...slug]');
});

test('never keeps an id, a number or a query string, even without params', () => {
  assert.equal(
    routeTemplate('/renter/properties/3f6c2a9e-8b1d-4c7a-9e2f-1a2b3c4d5e6f', null),
    '/renter/properties/[id]'
  );
  assert.equal(routeTemplate('/u/08012345678', {}), '/u/[id]');
  assert.equal(routeTemplate('/rent?q=flat+in+lekki', {}), '/rent');
  assert.equal(routeTemplate('/search/a%20b%40c.com', {}), '/search/[id]');
});
