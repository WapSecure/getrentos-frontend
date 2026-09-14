/**
 * Wording for a lease rent figure.
 *
 * Leases written before `Lease.rentPeriod` existed carry a single amount with no
 * cadence, and labelling that "Monthly rent" turned an annual figure into a 12x
 * overstatement on the very document a tenant signs. Where the cadence is
 * recorded it is used; otherwise the term dates are the only evidence left.
 */
/** Short suffix for inline figures, e.g. "₦2.4M/yr". */
export const rentSuffix = (period: 'month' | 'year' | undefined): string =>
  period === 'year' ? '/yr' : period === 'month' ? '/mo' : '';

/** Inline suffix for a lease rent, falling back to the term when no cadence is recorded. */
export function leaseRentSuffix(
  period: 'month' | 'year' | undefined,
  leaseStart: string,
  leaseEnd: string
): string {
  if (period) return rentSuffix(period);
  const label = describeRentPeriod(leaseStart, leaseEnd);
  if (label === 'Annual rent') return '/yr';
  if (label === 'Monthly rent') return '/mo';
  return '';
}

/**
 * Label for a lease rent. Prefers the cadence recorded on the lease and only
 * falls back to the term-derived wording for leases written before it existed.
 */
export function leaseRentLabel(
  period: 'month' | 'year' | undefined,
  leaseStart: string,
  leaseEnd: string
): string {
  if (period === 'year') return 'Annual rent';
  if (period === 'month') return 'Monthly rent';
  return describeRentPeriod(leaseStart, leaseEnd);
}

export function describeRentPeriod(leaseStart: string, leaseEnd: string): string {
  const start = new Date(leaseStart);
  const end = new Date(leaseEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Rent';

  const months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

  if (months <= 1) return 'Monthly rent';
  if (months >= 11 && months <= 13) return 'Annual rent';
  return `Rent (${months}-month term)`;
}
