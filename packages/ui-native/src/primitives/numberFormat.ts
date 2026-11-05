/** Digits only (plus one decimal point when allowed). Letters, spaces and symbols never get in. */
export function sanitizeNumber(raw: string, decimals: number): string {
  if (decimals <= 0) return raw.replace(/\D/g, '');
  const cleaned = raw.replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join('').slice(0, decimals)}`;
}

/**
 * A whole number as typed or pasted: everything after a decimal point is
 * dropped, so "7.5" is 7 and a pasted "₦1,250.50" is 1250. (Stripping the
 * point instead would turn them into 75 and 125050.) Codes don't use this:
 * a dot in a code means nothing, so sanitizeNumber just removes it.
 */
export function wholeNumber(raw: string): string {
  return raw.split('.')[0].replace(/\D/g, '');
}

export const group = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
