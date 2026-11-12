import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EMPTY_COMMERCIAL,
  addLeaseTerm,
  commercialDealCopy,
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

test('an "Other" lease term is a whole number of years from 1 to 99, once, at most 10', () => {
  assert.deepEqual(addLeaseTerm([5, 2], '4'), { years: [2, 4, 5] });
  assert.deepEqual(addLeaseTerm([], ' 99 '), { years: [99] });
  assert.match(addLeaseTerm([], '').error ?? '', /Enter/);
  assert.match(addLeaseTerm([], '0').error ?? '', /1 to 99/);
  assert.match(addLeaseTerm([], '100').error ?? '', /1 to 99/);
  assert.match(addLeaseTerm([], '2.5').error ?? '', /whole/);
  assert.match(addLeaseTerm([4], '4').error ?? '', /already/);
  const ten = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.match(addLeaseTerm(ten, '11').error ?? '', /at most 10/);
});

test('form errors catch lease terms the API would refuse', () => {
  const terms = (leaseTermOptionsYears: number[]) =>
    commercialError({ ...EMPTY_COMMERCIAL, leaseTermOptionsYears });
  assert.equal(terms([1, 4, 99]), null);
  assert.match(terms([0]) ?? '', /1 to 99/);
  assert.match(terms([100]) ?? '', /1 to 99/);
  assert.match(terms([3, 3]) ?? '', /once/);
  assert.match(terms([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) ?? '', /at most 10/);
});

test('a sale asks about the price and buyers; a let about the rent and renters', () => {
  assert.deepEqual(commercialDealCopy('sale'), { audience: 'Buyers', amount: 'Price' });
  assert.deepEqual(commercialDealCopy('rent'), { audience: 'Renters', amount: 'Rent' });
  assert.deepEqual(commercialDealCopy(), { audience: 'Renters', amount: 'Rent' });
});
