import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatLocation, tidyPlace } from '../src/utils/address.ts';

test('a city that repeats as the state is shown once', () => {
  assert.equal(formatLocation('Lagos', 'Lagos'), 'Lagos');
  assert.equal(formatLocation('Lagos, Lagos'), 'Lagos');
  assert.equal(formatLocation('Abuja', 'abuja'), 'Abuja');
  assert.equal(formatLocation('Lagos', 'Lagos State'), 'Lagos');
});

test('area, city and state read smallest first, each once', () => {
  assert.equal(formatLocation('Surulere', 'Lagos', 'Lagos'), 'Surulere, Lagos');
  assert.equal(formatLocation('Ikeja', 'Lagos'), 'Ikeja, Lagos');
  assert.equal(formatLocation('Wuse 2', 'Abuja', 'FCT (Abuja)'), 'Wuse 2, Abuja, FCT (Abuja)');
});

test('a repeat keeps its later, broader position', () => {
  assert.equal(formatLocation('Lagos, Ikeja, Lagos'), 'Ikeja, Lagos');
  assert.equal(
    formatLocation('12 Admiralty Way, Lekki', 'Lagos', 'Lagos'),
    '12 Admiralty Way, Lekki, Lagos'
  );
});

test('blank and missing parts are dropped', () => {
  assert.equal(formatLocation(undefined, '', ' ', 'Abuja', null), 'Abuja');
  assert.equal(formatLocation(), '');
  assert.equal(formatLocation(' , Lagos ,'), 'Lagos');
});

test('tidyPlace still works for callers holding one string', () => {
  assert.equal(tidyPlace('Lagos, Lagos'), 'Lagos');
});
