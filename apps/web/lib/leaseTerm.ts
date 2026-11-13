// Leases written before `Lease.rentPeriod` have no cadence, and labelling them "Monthly rent" overstated annual rent 12x: fall back to the term dates.
export const rentSuffix = (period: 'month' | 'year' | undefined): string =>
  period === 'year' ? '/yr' : period === 'month' ? '/mo' : '';

export function leaseRentSuffix(
  period: 'month' | 'year' | undefined,
  leaseStart: string,
  leaseEnd: string,
  rentChargeCount?: number
): string {
  if (period) return rentSuffix(period);
  const label = describeRentPeriod(leaseStart, leaseEnd, rentChargeCount);
  if (label === 'Annual rent') return '/yr';
  if (label === 'Monthly rent') return '/mo';
  return '';
}

export function leaseRentLabel(
  period: 'month' | 'year' | undefined | null,
  leaseStart: string,
  leaseEnd: string,
  rentChargeCount?: number
): string {
  if (period === 'year') return 'Annual rent';
  if (period === 'month') return 'Monthly rent';
  return describeRentPeriod(leaseStart, leaseEnd, rentChargeCount);
}

/** How many charges of exactly the rent amount the lease's payment schedule holds. */
export function countRentCharges(rentAmount: number, payments: { amount: number }[]): number {
  return payments.filter((p) => p.amount === rentAmount).length;
}

// A 12-month term says how long the tenancy runs, not how often rent is due: a monthly rent on a
// one-year lease was labelled "Annual rent". Three or more rent-sized charges mean instalments
// (two could be an annual rent plus a deposit of the same amount), so read it as monthly.
export function describeRentPeriod(
  leaseStart: string,
  leaseEnd: string,
  rentChargeCount?: number
): string {
  const start = new Date(leaseStart);
  const end = new Date(leaseEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Rent';

  const months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

  if (months <= 1) return 'Monthly rent';
  if (rentChargeCount !== undefined && rentChargeCount >= 3 && months >= rentChargeCount - 1) {
    return 'Monthly rent';
  }
  if (months >= 11 && months <= 13) return 'Annual rent';
  return `Rent (${months}-month term)`;
}
