import { VALIDATION_PATTERNS } from '@getrentos/shared';

/**
 * Strips characters that are not allowed by a given shared pattern's "strip"
 * twin. Patterns that end in `NON_*` are designed for use with `String.replace`.
 *
 * Example:
 *   sanitizeInput('24-B!!', VALIDATION_PATTERNS.NON_ALPHANUMERIC_SPACES) // '24-B'
 */
export const sanitizeInput = (value: string, stripPattern: RegExp): string =>
  value.replace(stripPattern, '');

/** Keep only digits (used by number-coded fields that don't use NumberInput). */
export const digitsOnly = (value: string): string =>
  sanitizeInput(value, VALIDATION_PATTERNS.NON_DIGITS);

/** Keep letters, spaces, apostrophes, dots and hyphens (names). */
export const nameOnly = (value: string): string =>
  sanitizeInput(value, VALIDATION_PATTERNS.NON_NAME);

/** Keep letters, digits and common punctuation (addresses, plot numbers). */
export const alphanumericOnly = (value: string): string =>
  sanitizeInput(value, VALIDATION_PATTERNS.NON_ALPHANUMERIC_SPACES);

/** True when a value is a valid whole number. */
export const isValidInteger = (value: string | number): boolean =>
  VALIDATION_PATTERNS.INTEGER.test(String(value));

/** True when a value is a valid decimal number. */
export const isValidDecimal = (value: string | number): boolean => {
  const str = String(value);
  if (str === '' || str === '.') return false;
  return VALIDATION_PATTERNS.DECIMAL.test(str);
};
