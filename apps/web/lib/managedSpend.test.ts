import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bandsFromInputs,
  duplicateFlagsOf,
  evidenceStates,
  isAwaitingOwnerApproval,
  isDuplicateInvoiceRefusal,
  needsExplicitAuthorisation,
} from './managedSpend';

test('only the earliest waiting stage is current', () => {
  assert.deepEqual(evidenceStates(['DONE', 'DONE', 'PENDING', 'PENDING']), [
    'done',
    'done',
    'current',
    'pending',
  ]);
});

test('flagged and not-applicable stages keep their own state', () => {
  assert.deepEqual(evidenceStates(['DONE', 'NOT_APPLICABLE', 'FLAGGED', 'PENDING']), [
    'done',
    'skipped',
    'blocked',
    'current',
  ]);
});

test('a finished job has no current stage', () => {
  assert.deepEqual(evidenceStates(['DONE', 'NOT_APPLICABLE', 'DONE']), ['done', 'skipped', 'done']);
});

test('spots spend parked for the owner', () => {
  assert.equal(
    isAwaitingOwnerApproval({ state: 'AWAITING_OWNER_APPROVAL', approvalId: 'a', band: 'OWNER' }),
    true
  );
  assert.equal(isAwaitingOwnerApproval({ id: 'wo', status: 'ASSIGNED' }), false);
  assert.equal(isAwaitingOwnerApproval(null), false);
});

test('spots a duplicate-invoice refusal by its code or detail code', () => {
  assert.equal(isDuplicateInvoiceRefusal({ code: 'INVOICE_POSSIBLE_DUPLICATE' }), true);
  assert.equal(isDuplicateInvoiceRefusal({ details: { code: 'DUPLICATE_INVOICE' } }), true);
  assert.equal(isDuplicateInvoiceRefusal({ code: 'STEP_UP_REQUIRED' }), false);
  assert.equal(isDuplicateInvoiceRefusal(new Error('nope')), false);
});

test('only explicit spend needs explicit authorisation', () => {
  assert.equal(needsExplicitAuthorisation('EXPLICIT'), true);
  assert.equal(needsExplicitAuthorisation('OWNER'), false);
  assert.equal(needsExplicitAuthorisation(undefined), false);
});

test('zero means no limit', () => {
  assert.deepEqual(bandsFromInputs({ routine: 50_000, emergency: 0, explicit: 500_000 }), {
    bands: { routineCap: 50_000, emergencyCap: null, explicitAbove: 500_000 },
    error: null,
  });
});

test('neither emergency nor explicit may sit below routine', () => {
  assert.equal(
    bandsFromInputs({ routine: 600_000, emergency: 0, explicit: 500_000 }).error?.field,
    'explicit'
  );
  assert.equal(
    bandsFromInputs({ routine: 100_000, emergency: 50_000, explicit: 0 }).error?.field,
    'emergency'
  );
  assert.equal(bandsFromInputs({ routine: 0, emergency: 10, explicit: 5 }).error, null);
});

test('reads the duplicate flags off the refusal, ignoring anything malformed', () => {
  const flag = { code: 'SAME_NUMBER', message: 'Same invoice number as INV-12' };
  assert.deepEqual(duplicateFlagsOf({ details: { flags: [flag, { code: 1 }, null] } }), [flag]);
  assert.deepEqual(duplicateFlagsOf({ details: {} }), []);
  assert.deepEqual(duplicateFlagsOf(null), []);
});
