import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_COMMERCIAL,
  commercialError,
  commercialFromDetails,
  commercialToCreatePayload,
  commercialToUpdatePayload,
} from './commercialDetails';

test('create payload carries only what is stated', () => {
  assert.equal(commercialToCreatePayload(EMPTY_COMMERCIAL), undefined);
  assert.deepEqual(
    commercialToCreatePayload({
      ...EMPTY_COMMERCIAL,
      permittedUse: 'OFFICE',
      lettableAreaSqm: '120.5',
      parkingSpaces: '0',
      generator: 'no',
      generatorNote: 'ignored when there is no generator',
      leaseTermOptionsYears: [5, 2],
      rentReviewNote: '  Every two years  ',
      vatStatedPct: '7.5',
    }),
    {
      permittedUse: 'OFFICE',
      lettableAreaSqm: 120.5,
      parkingSpaces: 0,
      generator: false,
      leaseTermOptionsYears: [2, 5],
      rentReviewNote: 'Every two years',
      vatStatedPct: 7.5,
    }
  );
});

test('update payload clears every blank field with null', () => {
  const payload = commercialToUpdatePayload({ ...EMPTY_COMMERCIAL, solar: 'yes' });
  assert.equal(payload.solar, true);
  assert.equal(payload.vatStatedPct, null);
  assert.equal(payload.rentReviewNote, null);
  assert.deepEqual(payload.leaseTermOptionsYears, []);
  assert.equal(Object.keys(payload).length, Object.keys(EMPTY_COMMERCIAL).length);
});

test('saved details round-trip through the form', () => {
  const saved = {
    permittedUse: 'SHOP' as const,
    generator: true,
    generatorNote: '60 kVA',
    vatIncluded: false,
    leaseTermOptionsYears: [3],
  };
  assert.deepEqual(commercialToCreatePayload(commercialFromDetails(saved)), saved);
});

test('form errors match the API limits', () => {
  assert.equal(commercialError(EMPTY_COMMERCIAL), null);
  assert.equal(commercialError({ ...EMPTY_COMMERCIAL, lettableAreaSqm: '10.15' }), null);
  assert.equal(commercialError({ ...EMPTY_COMMERCIAL, vatStatedPct: '7.' }), null);
  assert.match(commercialError({ ...EMPTY_COMMERCIAL, lettableAreaSqm: '0' }) ?? '', /between 1/);
  assert.match(
    commercialError({ ...EMPTY_COMMERCIAL, lettableAreaSqm: '10.125' }) ?? '',
    /two decimal/
  );
  assert.match(commercialError({ ...EMPTY_COMMERCIAL, publicSupplyHoursStated: '25' }) ?? '', /24/);
  assert.match(commercialError({ ...EMPTY_COMMERCIAL, vatStatedPct: '101' }) ?? '', /100%/);
  assert.match(commercialError({ ...EMPTY_COMMERCIAL, parkingSpaces: '10001' }) ?? '', /10,000/);
});
