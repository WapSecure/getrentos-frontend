import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  contactRequestBody,
  isNoAccountMessage,
  personContactLabel,
  readContactInput,
  signupInviteMessage,
  toE164Phone,
  whatsappShareUrl,
} from '../src/utils/personContact.ts';

test('reads every common way of writing a Nigerian number as one +234 number', () => {
  for (const raw of [
    '08031234567',
    '0803 123 4567',
    '0803-123-4567',
    '8031234567',
    '2348031234567',
    '+2348031234567',
    '+234 803 123 4567',
    '+234 0803 123 4567',
    '002348031234567',
  ]) {
    assert.equal(toE164Phone(raw), '+2348031234567', raw);
  }
  assert.equal(toE164Phone('+44 7700 900123'), '+447700900123');
  for (const raw of ['', '0803', '1234567890', 'abc', '+12'])
    assert.equal(toE164Phone(raw), null, raw);
});

test('tells an email from a phone number and explains a bad one', () => {
  assert.deepEqual(readContactInput('  '), { kind: 'empty' });
  assert.deepEqual(readContactInput(' Ada@Example.com '), {
    kind: 'email',
    email: 'Ada@Example.com',
  });
  assert.deepEqual(readContactInput('ada@'), {
    kind: 'invalid',
    message: 'Enter a valid email address.',
  });
  assert.deepEqual(readContactInput('0803 123 4567'), { kind: 'phone', e164: '+2348031234567' });
  assert.deepEqual(readContactInput('0803'), {
    kind: 'invalid',
    message: 'Enter a valid phone number, for example 0803 123 4567.',
  });
});

test('sends an email as `email` (older servers accept it) and a phone as `contact`', () => {
  assert.deepEqual(contactRequestBody('ada@example.com'), { email: 'ada@example.com' });
  assert.deepEqual(contactRequestBody('0803 123 4567'), { contact: '+2348031234567' });
  assert.equal(contactRequestBody('nope'), null);
});

test('shows the email, or the masked phone when there is no email', () => {
  assert.equal(
    personContactLabel({ email: 'ada@example.com', phoneMasked: '+234 803 *** 4567' }),
    'ada@example.com'
  );
  assert.equal(
    personContactLabel({ email: null, phoneMasked: '+234 803 *** 4567' }),
    '+234 803 *** 4567'
  );
  assert.equal(personContactLabel({}), undefined);
});

test('recognises the no-account answer and builds a plain invite', () => {
  assert.equal(
    isNoAccountMessage(
      'No Sureground account uses that phone number or email. Ask them to sign up first, then appoint them.'
    ),
    true
  );
  assert.equal(
    isNoAccountMessage('No Sureground account uses that email. Ask them to sign up first.'),
    true
  );
  assert.equal(isNoAccountMessage('You cannot appoint yourself'), false);
  const text = signupInviteMessage('https://getsureground.io/signup');
  assert.ok(text.endsWith('https://getsureground.io/signup'));
  assert.equal(whatsappShareUrl('a b'), 'https://wa.me/?text=a%20b');
});
