/**
 * Lease rent is stored as a single amount for the whole term, with no billing
 * cadence column (unlike Listing, which has `rentPeriod`). Labelling it "Monthly
 * rent" therefore turned an annual figure into a 12x overstatement on the very
 * document a tenant signs, so derive the wording from the term dates instead.
 */
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
