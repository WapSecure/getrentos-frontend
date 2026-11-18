import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  describeLockedFields,
  isLegalNameLockedByKyc,
  isLegalNameLockedError,
  isVerifiedPropertyStatus,
  lockedVerifiedFields,
  verifiedPropertyChanges,
} from '../src/utils/verifiedLocks.ts';

const lockError = (fields: string[]) => ({
  status: 409,
  details: { error: 'PROPERTY_VERIFIED_FIELDS_LOCKED', fields },
});

test('a verified-fields 409 gives back the fields it names', () => {
  assert.deepEqual(lockedVerifiedFields(lockError(['title', 'address'])), ['title', 'address']);
  assert.equal(lockedVerifiedFields({ status: 409, details: { error: 'OTHER' } }), null);
  assert.equal(
    lockedVerifiedFields({ status: 400, details: { error: 'PROPERTY_VERIFIED_FIELDS_LOCKED' } }),
    null
  );
});

test('the property name is described as a name, and a pin once', () => {
  assert.equal(
    describeLockedFields(['title', 'latitude', 'longitude']),
    'property name and map pin'
  );
});

test('a legal-name 409 is recognised from a safeCall response too', () => {
  assert.equal(isLegalNameLockedError({ status: 409, code: 'LEGAL_NAME_LOCKED' }), true);
  assert.equal(isLegalNameLockedError({ status: 409, code: 'CONFLICT' }), false);
});

test('verified identity or an approved ID document locks the legal name', () => {
  assert.equal(isLegalNameLockedByKyc({ identityVerified: true }), true);
  assert.equal(isLegalNameLockedByKyc({ identity: { status: 'APPROVED' } }), true);
  assert.equal(isLegalNameLockedByKyc({ identity: { status: 'PENDING' } }), false);
  assert.equal(isLegalNameLockedByKyc(undefined), false);
});

test('either spelling of a verified status counts', () => {
  assert.equal(isVerifiedPropertyStatus('verified'), true);
  assert.equal(isVerifiedPropertyStatus('APPROVED'), true);
  assert.equal(isVerifiedPropertyStatus('pending_review'), false);
  assert.equal(isVerifiedPropertyStatus('pending', true), true);
});

test('a change request carries only the verified details that changed', () => {
  const current = {
    name: 'Palm Court',
    address: '2 Bode St',
    city: 'Lekki',
    state: 'Lagos',
    country: 'Nigeria',
    latitude: 6.4,
    longitude: 3.5,
  };
  assert.deepEqual(verifiedPropertyChanges(current, { ...current, name: ' Palm Court ' }), {});
  assert.deepEqual(
    verifiedPropertyChanges(current, {
      ...current,
      name: 'Palm Court II',
      latitude: 6.41,
      placeId: 'place-1',
    }),
    { title: 'Palm Court II', latitude: 6.41, longitude: 3.5 }
  );
  assert.deepEqual(
    verifiedPropertyChanges(current, { ...current, address: '4 Bode St', placeId: 'place-2' }),
    { address: '4 Bode St', placeId: 'place-2' }
  );
});
