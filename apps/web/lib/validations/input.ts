import { VALIDATION_PATTERNS } from '@sureground/shared';

export const sanitizeInput = (value: string, stripPattern: RegExp): string =>
  value.replace(stripPattern, '');

export const digitsOnly = (value: string): string =>
  sanitizeInput(value, VALIDATION_PATTERNS.NON_DIGITS);

export const nameOnly = (value: string): string =>
  sanitizeInput(value, VALIDATION_PATTERNS.NON_NAME);

export const alphanumericOnly = (value: string): string =>
  sanitizeInput(value, VALIDATION_PATTERNS.NON_ALPHANUMERIC_SPACES);

export const isValidInteger = (value: string | number): boolean =>
  VALIDATION_PATTERNS.INTEGER.test(String(value));

export const isValidDecimal = (value: string | number): boolean => {
  const str = String(value);
  if (str === '' || str === '.') return false;
  return VALIDATION_PATTERNS.DECIMAL.test(str);
};
