import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  authErrorCode,
  authErrorField,
  authErrorMessage,
  oauthErrorMessage,
  retryAfterSeconds,
} from '../src/auth/authErrors.ts';

test('the body code wins over the Nest error label', () => {
  const res = { code: 'Bad Request', details: { code: 'PASSWORD_BREACHED', field: 'password' } };
  assert.equal(authErrorCode(res), 'PASSWORD_BREACHED');
  assert.equal(authErrorField(res), 'password');
});

test('a plain Nest error label is not taken for a code', () => {
  assert.equal(authErrorCode({ code: 'Conflict', details: { error: 'Conflict' } }), undefined);
  assert.equal(authErrorCode({ code: 'Bad Request' }), undefined);
});

test('known codes get fixed copy, whatever the server says', () => {
  const res = { details: { code: 'ACCOUNT_EXISTS' }, message: 'User with email x exists' };
  assert.match(authErrorMessage(res, 'fallback'), /already an account/);
});

test('wait codes say how long to wait', () => {
  const res = { details: { code: 'RESEND_TOO_SOON', retryAfterSeconds: 20 } };
  assert.equal(retryAfterSeconds(res), 20);
  assert.equal(authErrorMessage(res, 'x'), 'Wait 20 seconds before asking for a new code.');
  const capped = { details: { code: 'TOO_MANY_CODES', retryAfterSeconds: 1500 } };
  assert.equal(
    authErrorMessage(capped, 'x'),
    'We have sent several codes already. Try again in 25 minutes.'
  );
  const daily = { details: { code: 'TOO_MANY_CODES', retryAfterSeconds: 80_000 } };
  assert.equal(
    authErrorMessage(daily, 'x'),
    'We have sent several codes already. Try again in 23 hours.'
  );
});

test('an unknown code falls back to the server message, then the fallback', () => {
  assert.equal(authErrorMessage({ details: { code: 'SOMETHING_NEW' }, message: 'Hi' }, 'x'), 'Hi');
  assert.equal(authErrorMessage({}, 'Try again'), 'Try again');
});

test('OAuth errors never echo text from the URL', () => {
  assert.match(oauthErrorMessage('OAUTH_CANCELLED'), /cancelled/);
  assert.equal(oauthErrorMessage('<script>alert(1)</script>'), oauthErrorMessage('OAUTH_FAILED'));
  assert.equal(oauthErrorMessage(null), oauthErrorMessage('OAUTH_FAILED'));
});
