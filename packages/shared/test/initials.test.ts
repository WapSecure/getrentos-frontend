import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getInitials } from '../src/utils/format.ts';

test('initials skip words that do not start with a letter', () => {
  assert.equal(getInitials('Tunde Bakare (demo)'), 'TB');
  assert.equal(getInitials('Amaka Obi'), 'AO');
  assert.equal(getInitials('Ọlá  Adé'), 'ỌA');
  assert.equal(getInitials('(x)'), 'U');
});
