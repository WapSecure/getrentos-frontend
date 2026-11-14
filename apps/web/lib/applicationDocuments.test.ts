import { test } from 'node:test';
import assert from 'node:assert/strict';
import { savedDocumentFits } from './applicationDocuments';

test('an ID card is not offered as proof of income or a bank statement', () => {
  const id = { name: 'Government ID', category: 'identity' };
  assert.equal(savedDocumentFits('Government ID', id), true);
  assert.equal(savedDocumentFits('Proof of Income', id), false);
  assert.equal(savedDocumentFits('Bank Statement', id), false);
});

test('documents of the right kind are offered', () => {
  assert.equal(savedDocumentFits('Proof of Income', { name: 'Payslip October 2026' }), true);
  assert.equal(savedDocumentFits('Bank Statement', { name: 'GTBank statement Q3' }), true);
  assert.equal(savedDocumentFits('Government ID', { name: 'International passport' }), true);
  assert.equal(
    savedDocumentFits('Reference Letter', { name: 'Reference from previous landlord' }),
    true
  );
});

test('an unknown slot only takes a file with the same name', () => {
  assert.equal(savedDocumentFits('Guarantor form', { name: 'Guarantor form' }), true);
  assert.equal(savedDocumentFits('Guarantor form', { name: 'Payslip' }), false);
});
