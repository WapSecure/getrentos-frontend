import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moveInReleasedMessage } from './moveInRelease';

test('names the released amount and the home', () => {
  const message = moveInReleasedMessage(200_000, 'Lekki 2-bed');
  assert.match(message, /^₦200,000 released to your landlord for Lekki 2-bed\.$/);
});

test('without a held figure it still confirms the release, never ₦0', () => {
  assert.equal(moveInReleasedMessage(undefined), 'Your rent has been released to your landlord.');
  assert.equal(
    moveInReleasedMessage(0, 'Lekki 2-bed'),
    'Your rent for Lekki 2-bed has been released to your landlord.'
  );
});
