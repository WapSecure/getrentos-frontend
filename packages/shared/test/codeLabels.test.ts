import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codeLabel, formatDateTime, humaniseCodesInText } from '../src/utils/codeLabels.ts';

test('known codes map to their human labels', () => {
  assert.equal(codeLabel('C_OF_O'), 'Certificate of Occupancy');
  assert.equal(codeLabel('MEDIA_SPARSE'), 'Few photos');
  assert.equal(codeLabel('PRICE_IMPLAUSIBLE'), 'Price looks implausible');
  assert.equal(codeLabel('ESCROW_REVIEW_REQUESTED'), 'Escrow review requested');
});

test('unknown codes are humanised in sentence case, keeping acronyms', () => {
  assert.equal(codeLabel('ACCEPTED'), 'Accepted');
  assert.equal(codeLabel('medium'), 'Medium');
  assert.equal(codeLabel('high'), 'High');
  assert.equal(codeLabel('OFFER_COUNTERED'), 'Offer countered');
  assert.equal(codeLabel('NIN_SLIP'), 'NIN slip');
  assert.equal(codeLabel(''), '');
  assert.equal(codeLabel(null), '');
});

test('codes embedded in sentences are replaced, plain words are not', () => {
  assert.equal(
    humaniseCodesInText('Ownership proof (C_OF_O)'),
    'Ownership proof (Certificate of Occupancy)'
  );
  assert.equal(
    humaniseCodesInText(
      'Signal, not a verdict: DETAILS_INCONSISTENT, PRICE_IMPLAUSIBLE, MEDIA_SPARSE.'
    ),
    'Signal, not a verdict: Details do not agree, Price looks implausible, Few photos.'
  );
  assert.equal(humaniseCodesInText('Identity document (NIN)'), 'Identity document (NIN)');
});

test('formatDateTime is unambiguous', () => {
  const out = formatDateTime(new Date(2026, 10, 9, 14, 5));
  assert.equal(out, '9 Nov 2026, 14:05');
  assert.equal(formatDateTime('not a date'), '');
});
