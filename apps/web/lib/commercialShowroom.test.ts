import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AS_STATED,
  commercialSections,
  formatLeaseTerms,
  formatStatedPct,
  publicSupplyLine,
  vatRow,
  vatStated,
} from './commercialShowroom';

test('lease terms read as a short list', () => {
  assert.equal(formatLeaseTerms([1]), '1 year');
  assert.equal(formatLeaseTerms([5]), '5 years');
  assert.equal(formatLeaseTerms([1, 2]), '1 or 2 years');
  assert.equal(formatLeaseTerms([1, 2, 3]), '1, 2 or 3 years');
  assert.equal(formatLeaseTerms([]), '');
});

test('VAT is shown exactly as stated and never worked out', () => {
  assert.equal(formatStatedPct(7.5), '7.5%');
  assert.equal(formatStatedPct(7), '7%');
  assert.deepEqual(vatRow({ vatStatedPct: 7.5 }, 'rent'), {
    key: 'vat',
    label: 'VAT',
    value: '7.5% (stated by the landlord)',
    hint: undefined,
  });
  assert.equal(vatRow({ vatIncluded: true }, 'rent')?.value, 'Rent includes VAT (stated)');
  assert.equal(vatRow({ vatIncluded: false }, 'rent')?.value, 'Rent does not include VAT (stated)');
  assert.equal(vatRow({ vatIncluded: true }, 'sale')?.value, 'Price includes VAT (stated)');
  assert.equal(
    vatRow({ vatStatedPct: 7.5, vatIncluded: true }, 'rent')?.hint,
    'Rent includes VAT (stated)'
  );
  assert.equal(vatRow({}, 'rent'), null);
  assert.equal(vatStated({}), false);
  assert.equal(vatStated({ vatIncluded: false }), true);
  assert.equal(vatStated(undefined), false);
});

test('public supply hours are labelled as stated', () => {
  assert.equal(publicSupplyLine(12), 'About 12 hours a day (stated)');
  assert.equal(publicSupplyLine(1), 'About 1 hour a day (stated)');
  assert.equal(publicSupplyLine(0), 'None (stated)');
});

test('sections hold only what the lister stated', () => {
  const empty = commercialSections({}, 'rent');
  assert.deepEqual(empty, { lease: [], space: [], running: [] });

  const { lease, space, running } = commercialSections(
    {
      leaseTermOptionsYears: [1, 2, 3],
      rentReviewNote: 'Every 2 years',
      vatStatedPct: 7.5,
      permittedUse: 'SHOP',
      permittedUseNote: 'No food preparation',
      lettableAreaSqm: 1250.5,
      fitOutCondition: 'SEMI_FITTED',
      parkingSpaces: 1,
      publicSupplyHoursStated: 16,
      generator: true,
      generatorNote: '100 kVA',
      solar: false,
    },
    'rent'
  );
  assert.deepEqual(
    lease.map((r) => [r.label, r.value, r.hint]),
    [
      ['Lease terms on offer', '1, 2 or 3 years', undefined],
      ['Rent review', 'Every 2 years', AS_STATED],
      ['VAT', '7.5% (stated by the landlord)', undefined],
    ]
  );
  assert.deepEqual(
    space.map((r) => [r.label, r.value, r.hint]),
    [
      ['Permitted use', 'Shop', 'No food preparation'],
      ['Lettable area', '1,250.5 m²', undefined],
      ['Fit-out', 'Semi-fitted', 'Some finishes and services are in, and you complete the rest.'],
    ]
  );
  assert.deepEqual(
    running.map((r) => [r.label, r.value, r.hint]),
    [
      ['Parking', '1 space', undefined],
      ['Public supply', 'About 16 hours a day (stated)', undefined],
      ['Generator', 'Yes', '100 kVA'],
      ['Solar', 'No', undefined],
    ]
  );
});

test('a note is dropped when the lister says there is none', () => {
  const { running } = commercialSections(
    { generator: false, generatorNote: 'old note', loadingAccess: false, parkingSpaces: 0 },
    'rent'
  );
  assert.deepEqual(
    running.map((r) => [r.label, r.value, r.hint]),
    [
      ['Parking', 'None', undefined],
      ['Generator', 'No', undefined],
      ['Loading access', 'No', undefined],
    ]
  );
});

test('a use note stands alone when no use is chosen', () => {
  const { space } = commercialSections({ permittedUseNote: 'Ground floor retail only' }, 'sale');
  assert.deepEqual(space[0], {
    key: 'permitted-use',
    label: 'Permitted use',
    value: 'Ground floor retail only',
  });
});
