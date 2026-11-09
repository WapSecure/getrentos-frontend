// Leases written before `Lease.rentPeriod` have no cadence, and labelling them "Monthly rent" overstated annual rent 12x: fall back to the term dates.
export const rentSuffix = (period: 'month' | 'year' | undefined): string =>
  period === 'year' ? '/yr' : period === 'month' ? '/mo' : '';

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
