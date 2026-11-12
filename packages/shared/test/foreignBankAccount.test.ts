import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  currencyForCountry,
  isValidAbaRouting,
  isValidIban,
  isValidSwiftBic,
  schemeForCountry,
  validateForeignBankAccount,
} from '../src/utils/foreignBankAccount.ts';

test('IBAN: mod-97 and country length', () => {
  assert.equal(isValidIban('GB82WEST12345698765432'), true);
  assert.equal(isValidIban('DE89 3704 0044 0532 0130 00'), true);
  assert.equal(isValidIban('DE89370400440532013001'), false);
  assert.equal(isValidIban('DE8937040044053201300'), false);
});

test('ABA routing checksum', () => {
  assert.equal(isValidAbaRouting('021000021'), true);
  assert.equal(isValidAbaRouting('021000022'), false);
  assert.equal(isValidAbaRouting('000000000'), false);
});

test('SWIFT/BIC format', () => {
  assert.equal(isValidSwiftBic('NWBKGB2L'), true);
  assert.equal(isValidSwiftBic('BOFAUS3NXXX'), true);
  assert.equal(isValidSwiftBic('DEUTDEFF5'), false);
});

test('scheme and currency follow the country', () => {
  assert.equal(schemeForCountry('GB'), 'UK');
  assert.equal(schemeForCountry('FR'), 'IBAN');
  assert.equal(schemeForCountry('NG'), null);
  assert.equal(currencyForCountry('CA'), 'CAD');
  assert.equal(currencyForCountry('IE'), 'EUR');
});

test('validateForeignBankAccount keeps only the scheme fields', () => {
  const result = validateForeignBankAccount({
    accountHolderName: 'Ada Obi',
    country: 'GB',
    currency: 'GBP',
    sortCode: '40-47-84',
    accountNumber: '70991234',
    routingNumber: '021000021',
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.sortCode, '404784');
    assert.equal(result.value.routingNumber, null);
  }
});

test('validateForeignBankAccount reports each bad field', () => {
  const result = validateForeignBankAccount({
    accountHolderName: 'Ada Obi',
    country: 'CA',
    currency: 'USD',
    transitNumber: '1234',
    institutionNumber: '003',
    accountNumber: '1234567',
  });
  assert.equal(result.ok, false);
  if (!result.ok)
    assert.deepEqual(Object.keys(result.errors).sort(), ['currency', 'transitNumber']);
});
