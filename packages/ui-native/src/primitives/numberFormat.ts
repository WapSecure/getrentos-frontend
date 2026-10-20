/** Digits only (plus one decimal point when allowed). Letters, spaces and symbols never get in. */
export function sanitizeNumber(raw: string, decimals: number): string {
  if (decimals <= 0) return raw.replace(/\D/g, '');
  const cleaned = raw.replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join('').slice(0, decimals)}`;
}

export const group = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
