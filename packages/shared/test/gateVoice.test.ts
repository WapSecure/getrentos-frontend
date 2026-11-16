import { test } from 'node:test';
import assert from 'node:assert/strict';
import { digitsFromSpeech } from '../src/utils/gateVoice.ts';

test('number words, digits, double and oh', () => {
  assert.equal(digitsFromSpeech('4 0 9 2 2 1'), '409221');
  assert.equal(digitsFromSpeech('four oh nine, double two one'), '409221');
  assert.equal(digitsFromSpeech('409 221'), '409221');
});

test('sound-alikes count between digits, as recognisers often hear them', () => {
  assert.equal(digitsFromSpeech('eight for three eight nine nine'), '843899');
  assert.equal(digitsFromSpeech('one to three ate five six'), '123856');
  assert.equal(digitsFromSpeech('double to five six seven'), '22567');
});

test('ordinary words around the number are ignored', () => {
  assert.equal(digitsFromSpeech('the PIN for them is seven seven three, one zero five'), '773105');
  assert.equal(digitsFromSpeech('this is for you'), '');
});
