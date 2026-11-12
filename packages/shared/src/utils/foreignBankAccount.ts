/**
 * Format and checksum rules for bank accounts abroad, for web and mobile. A port of the backend's
 * src/shared/banking/foreign-bank-account.rules.ts, which is the check that counts: change both together.
 * Pure: no lookup proves the account exists, only that it is well formed.
 */

/** IBAN lengths for the countries we take IBANs from (SEPA euro countries). */
export const IBAN_LENGTHS: Readonly<Record<string, number>> = {
  AT: 20,
  BE: 16,
  CY: 28,
  DE: 22,
  EE: 20,
  ES: 24,
  FI: 18,
  FR: 27,
  GB: 22,
  GR: 27,
  HR: 21,
  IE: 22,
  IT: 27,
  LT: 20,
  LU: 20,
  LV: 21,
  MT: 31,
  NL: 18,
  PT: 25,
  SI: 19,
  SK: 24,
};

/** Euro countries in SEPA whose accounts are given as an IBAN. */
export const SEPA_EURO_COUNTRIES: readonly string[] = [
  'AT',
  'BE',
  'CY',
  'DE',
  'EE',
  'ES',
  'FI',
  'FR',
  'GR',
  'HR',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'PT',
  'SI',
  'SK',
];

export type ForeignAccountScheme = 'UK' | 'US' | 'CA' | 'IBAN';

export function schemeForCountry(country: string): ForeignAccountScheme | null {
  const code = (country ?? '').toUpperCase();
  if (code === 'GB') return 'UK';
  if (code === 'US') return 'US';
  if (code === 'CA') return 'CA';
  if (SEPA_EURO_COUNTRIES.includes(code)) return 'IBAN';
  return null;
}

/** The only currency an account in that country is paid in; null for a country we do not support. */
export function currencyForCountry(country: string): string | null {
  const scheme = schemeForCountry(country);
  if (scheme === 'UK') return 'GBP';
  if (scheme === 'US') return 'USD';
  if (scheme === 'CA') return 'CAD';
  if (scheme === 'IBAN') return 'EUR';
  return null;
}

/** Uppercase with spaces, dashes and dots removed. */
export function compactBankValue(value: string | null | undefined): string {
  return (value ?? '').replace(/[\s.-]/g, '').toUpperCase();
}

const digits = (value: string, min: number, max = min) =>
  new RegExp(`^\\d{${min},${max}}$`).test(value);

/** ISO 13616: right length for its country, then mod-97 of the rearranged number is 1. */
export function isValidIban(value: string): boolean {
  const iban = compactBankValue(value);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return false;
  const length = IBAN_LENGTHS[iban.slice(0, 2)];
  if (!length || iban.length !== length) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const n = char >= 'A' ? (char.charCodeAt(0) - 55).toString() : char;
    for (const d of n) remainder = (remainder * 10 + Number(d)) % 97;
  }
  return remainder === 1;
}

/** ABA routing number: nine digits whose 3-7-1 weighted sum is a multiple of ten. */
export function isValidAbaRouting(value: string): boolean {
  const routing = compactBankValue(value);
  if (!digits(routing, 9) || /^0+$/.test(routing)) return false;
  const d = routing.split('').map(Number);
  const sum = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8]);
  return sum % 10 === 0;
}

export function isValidUkSortCode(value: string): boolean {
  return digits(compactBankValue(value), 6);
}

export function isValidUkAccountNumber(value: string): boolean {
  return digits(compactBankValue(value), 8);
}

export function isValidUsAccountNumber(value: string): boolean {
  return digits(compactBankValue(value), 4, 17);
}

export function isValidCaTransit(value: string): boolean {
  return digits(compactBankValue(value), 5);
}

export function isValidCaInstitution(value: string): boolean {
  return digits(compactBankValue(value), 3);
}

export function isValidCaAccountNumber(value: string): boolean {
  return digits(compactBankValue(value), 7, 12);
}

/** ISO 9362: bank (4 letters), country (2 letters), location (2), optional branch (3). */
export function isValidSwiftBic(value: string): boolean {
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(compactBankValue(value));
}

export interface ForeignBankAccountInput {
  accountHolderName: string;
  country: string;
  currency: string;
  iban?: string | null;
  accountNumber?: string | null;
  sortCode?: string | null;
  routingNumber?: string | null;
  transitNumber?: string | null;
  institutionNumber?: string | null;
  swiftBic?: string | null;
  bankName?: string | null;
}

/** Only the fields its country's scheme uses; everything else is null, so nothing unneeded is stored. */
export interface NormalisedForeignBankAccount {
  accountHolderName: string;
  country: string;
  currency: string;
  iban: string | null;
  accountNumber: string | null;
  sortCode: string | null;
  routingNumber: string | null;
  transitNumber: string | null;
  institutionNumber: string | null;
  swiftBic: string | null;
  bankName: string | null;
}

export type ForeignAccountField = keyof ForeignBankAccountInput;

export type ForeignAccountValidation =
  | { ok: true; value: NormalisedForeignBankAccount }
  | { ok: false; errors: Partial<Record<ForeignAccountField, string>> };

export function validateForeignBankAccount(
  input: ForeignBankAccountInput
): ForeignAccountValidation {
  const errors: Partial<Record<ForeignAccountField, string>> = {};
  const country = compactBankValue(input.country);
  const currency = compactBankValue(input.currency);
  const scheme = schemeForCountry(country);
  const accountHolderName = (input.accountHolderName ?? '').trim().replace(/\s+/g, ' ');
  const bankName = (input.bankName ?? '').trim() || null;
  const swiftBic = compactBankValue(input.swiftBic) || null;

  if (accountHolderName.length < 2) errors.accountHolderName = 'Enter the name on the account.';
  if (!scheme) {
    errors.country = 'Accounts in this country are not supported yet.';
  } else if (currency !== currencyForCountry(country)) {
    errors.currency = `Accounts in ${country} are paid in ${currencyForCountry(country)}.`;
  }
  if (swiftBic && (!isValidSwiftBic(swiftBic) || swiftBic.slice(4, 6) !== country)) {
    errors.swiftBic = 'Enter a valid SWIFT/BIC code for a bank in this country.';
  }

  const fields = {
    iban: null as string | null,
    accountNumber: null as string | null,
    sortCode: null as string | null,
    routingNumber: null as string | null,
    transitNumber: null as string | null,
    institutionNumber: null as string | null,
  };

  if (scheme === 'IBAN') {
    const iban = compactBankValue(input.iban);
    if (!isValidIban(iban)) errors.iban = 'Enter a valid IBAN.';
    else if (iban.slice(0, 2) !== country) errors.iban = 'This IBAN is for a different country.';
    fields.iban = iban;
  } else if (scheme === 'UK') {
    fields.sortCode = compactBankValue(input.sortCode);
    fields.accountNumber = compactBankValue(input.accountNumber);
    if (!isValidUkSortCode(fields.sortCode)) errors.sortCode = 'Enter the 6-digit sort code.';
    if (!isValidUkAccountNumber(fields.accountNumber))
      errors.accountNumber = 'Enter the 8-digit account number.';
  } else if (scheme === 'US') {
    fields.routingNumber = compactBankValue(input.routingNumber);
    fields.accountNumber = compactBankValue(input.accountNumber);
    if (!isValidAbaRouting(fields.routingNumber))
      errors.routingNumber = 'Enter a valid 9-digit routing number.';
    if (!isValidUsAccountNumber(fields.accountNumber))
      errors.accountNumber = 'Enter an account number of 4 to 17 digits.';
  } else if (scheme === 'CA') {
    fields.transitNumber = compactBankValue(input.transitNumber);
    fields.institutionNumber = compactBankValue(input.institutionNumber);
    fields.accountNumber = compactBankValue(input.accountNumber);
    if (!isValidCaTransit(fields.transitNumber))
      errors.transitNumber = 'Enter the 5-digit transit number.';
    if (!isValidCaInstitution(fields.institutionNumber)) {
      errors.institutionNumber = 'Enter the 3-digit institution number.';
    }
    if (!isValidCaAccountNumber(fields.accountNumber))
      errors.accountNumber = 'Enter an account number of 7 to 12 digits.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { accountHolderName, country, currency, ...fields, swiftBic, bankName },
  };
}

/** The countries the form offers, by scheme, in the order shown. */
export const FOREIGN_ACCOUNT_COUNTRIES: readonly { code: string; name: string }[] = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'IE', name: 'Ireland' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'PT', name: 'Portugal' },
  { code: 'FI', name: 'Finland' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'GR', name: 'Greece' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'MT', name: 'Malta' },
  { code: 'EE', name: 'Estonia' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'HR', name: 'Croatia' },
];

/** The copy every payout-abroad surface uses: no dates promised. */
export const FOREIGN_PAYOUTS_PENDING_NOTE =
  'Payouts to accounts abroad start once our licensed partner is live.';
