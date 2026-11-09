export function sanitizeNumber(raw: string, decimals: number): string {
  if (decimals <= 0) return raw.replace(/\D/g, '');
  const cleaned = raw.replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join('').slice(0, decimals)}`;
}

// Drops everything after the point: stripping just the point would turn "₦1,250.50" into 125050.
export function wholeNumber(raw: string): string {
  return raw.split('.')[0].replace(/\D/g, '');
}

export const group = (digits: string) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
