/** Structural, so web and mobile can pass their own landlord property types. */
interface RentFigures {
  totalUnits: number;
  /** Contracted rent per year across let units. */
  annualRentRoll: number;
  /** Lowest asking rent among units with no current tenancy, in its own period. */
  askingRent?: number;
  askingRentPeriod?: 'month' | 'year';
  /** The vacant units ask different rents, so `askingRent` is the lowest of them. */
  askingRentVaries?: boolean;
}

export type PropertyRentSummary =
  | { kind: 'let'; amount: number; period: 'year' }
  | { kind: 'asking'; amount: number; period: 'month' | 'year'; from: boolean }
  | { kind: 'none'; label: string };

/**
 * What a landlord's property card shows for money. A property with no let units has no rent roll, and
 * "₦0/yr" read as zero rent, so it shows the asking rent instead, or says plainly that nothing is let.
 */
export function propertyRentSummary(p: RentFigures): PropertyRentSummary {
  if (p.annualRentRoll > 0) return { kind: 'let', amount: p.annualRentRoll, period: 'year' };
  if (typeof p.askingRent === 'number' && p.askingRent > 0) {
    return {
      kind: 'asking',
      amount: p.askingRent,
      period: p.askingRentPeriod ?? 'year',
      from: !!p.askingRentVaries,
    };
  }
  if (p.totalUnits === 0) return { kind: 'none', label: 'No units yet' };
  return { kind: 'none', label: 'Not let' };
}
