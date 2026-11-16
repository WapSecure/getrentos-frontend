import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeNextPath, withNext } from './nextPath';

test('a path on this site is kept', () => {
  assert.equal(safeNextPath('/renter/saved?tab=homes#top'), '/renter/saved?tab=homes#top');
  assert.equal(safeNextPath('/agency-invite/claim?token=abc'), '/agency-invite/claim?token=abc');
});

test('anything that could leave the site is refused', () => {
  for (const value of [
    '/\t/evil.com',
    '/\n/evil.com',
    '/\r/evil.com',
    '//evil.com',
    '/\\evil.com',
    '/foo\\..\\..\\evil.com',
    'https://evil.com',
    'javascript:alert(1)',
    'evil.com',
    '',
    null,
    undefined,
  ]) {
    assert.equal(safeNextPath(value), null, JSON.stringify(value));
  }
});

test('withNext drops an unsafe next', () => {
  assert.equal(withNext('/login', '//evil.com'), '/login');
  assert.equal(withNext('/login', '/renter/saved'), '/login?next=%2Frenter%2Fsaved');
});
