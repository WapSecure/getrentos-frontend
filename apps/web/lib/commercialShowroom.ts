import type {
  CommercialDetails,
  CommercialFitOutCondition,
  CommercialPermittedUse,
  ShowroomMarket,
} from '@sureground/shared/showroom';

// Type-only imports keep this file runnable under Node's type stripping for the unit tests.

/** One row on the showroom page. Only what the lister stated ever becomes a row. */
export interface CommercialRow {
  key: string;
  label: string;
  value: string;
  hint?: string;
}

export interface CommercialSections {
  lease: CommercialRow[];
  space: CommercialRow[];
  running: CommercialRow[];
}

/** The id the VAT row carries, so a note by the costs can link to it. */
export const COMMERCIAL_VAT_ANCHOR = 'commercial-vat';

export const AS_STATED = 'As stated in the listing';

const PERMITTED_USE: Record<CommercialPermittedUse, string> = {
  SHOP: 'Shop',
  OFFICE: 'Office',
  WAREHOUSE: 'Warehouse',
  MIXED: 'Mixed use',
  OTHER: 'Other',
};

const FIT_OUT: Record<CommercialFitOutCondition, { label: string; explanation: string }> = {
  SHELL: {
    label: 'Shell',
    explanation: 'A bare space: you put in the floors, ceilings, partitions and services.',
  },
  SEMI_FITTED: {
    label: 'Semi-fitted',
    explanation: 'Some finishes and services are in, and you complete the rest.',
  },
  FITTED: {
    label: 'Fitted',
    explanation: 'Finished with services in place, ready for your furniture and equipment.',
  },
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const number = (n: number) =>
  new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(n);

/** "1 year", "1 or 2 years", "1, 2 or 3 years". */
export function formatLeaseTerms(years: readonly number[]): string {
  if (years.length === 0) return '';
  const unit = years.length === 1 && years[0] === 1 ? 'year' : 'years';
  const list =
    years.length === 1
      ? String(years[0])
      : `${years.slice(0, -1).join(', ')} or ${years[years.length - 1]}`;
  return `${list} ${unit}`;
}

/** The rate exactly as stated: 7.5 is "7.5%", 7 is "7%". */
export const formatStatedPct = (pct: number) => `${number(pct)}%`;

export function publicSupplyLine(hours: number): string {
  if (hours === 0) return 'None (stated)';
  return `About ${plural(hours, 'hour', 'hours')} a day (stated)`;
}

const yesNo = (v: boolean) => (v ? 'Yes' : 'No');

/** The VAT row, only from what the landlord states. Nothing is ever worked out from the rate. */
export function vatRow(
  c: Pick<CommercialDetails, 'vatStatedPct' | 'vatIncluded'>,
  market: ShowroomMarket
): CommercialRow | null {
  const amount = market === 'rent' ? 'Rent' : 'Price';
  const included =
    c.vatIncluded === undefined
      ? undefined
      : c.vatIncluded
        ? `${amount} includes VAT (stated)`
        : `${amount} does not include VAT (stated)`;
  if (c.vatStatedPct !== undefined)
    return {
      key: 'vat',
      label: 'VAT',
      value: `${formatStatedPct(c.vatStatedPct)} (stated by the landlord)`,
      hint: included,
    };
  if (included) return { key: 'vat', label: 'VAT', value: included };
  return null;
}

/** True when the landlord says anything about VAT. */
export const vatStated = (c?: CommercialDetails) =>
  !!c && (c.vatStatedPct !== undefined || c.vatIncluded !== undefined);

const present = (rows: (CommercialRow | null)[]) => rows.filter((r): r is CommercialRow => !!r);

/** The commercial journey on the page: lease and terms, the space, then running the business. */
export function commercialSections(
  c: CommercialDetails,
  market: ShowroomMarket
): CommercialSections {
  const lease = present([
    c.leaseTermOptionsYears?.length
      ? {
          key: 'lease-terms',
          label: 'Lease terms on offer',
          value: formatLeaseTerms(c.leaseTermOptionsYears),
        }
      : null,
    c.rentReviewNote
      ? { key: 'rent-review', label: 'Rent review', value: c.rentReviewNote, hint: AS_STATED }
      : null,
    c.escalationNote
      ? { key: 'escalation', label: 'Escalation', value: c.escalationNote, hint: AS_STATED }
      : null,
    vatRow(c, market),
  ]);

  const space = present([
    c.permittedUse
      ? {
          key: 'permitted-use',
          label: 'Permitted use',
          value: PERMITTED_USE[c.permittedUse],
          hint: c.permittedUseNote,
        }
      : c.permittedUseNote
        ? { key: 'permitted-use', label: 'Permitted use', value: c.permittedUseNote }
        : null,
    c.lettableAreaSqm !== undefined
      ? { key: 'area', label: 'Lettable area', value: `${number(c.lettableAreaSqm)} m²` }
      : null,
    c.fitOutCondition
      ? {
          key: 'fit-out',
          label: 'Fit-out',
          value: FIT_OUT[c.fitOutCondition].label,
          hint: FIT_OUT[c.fitOutCondition].explanation,
        }
      : null,
  ]);

  const running = present([
    c.parkingSpaces !== undefined
      ? {
          key: 'parking',
          label: 'Parking',
          value: c.parkingSpaces === 0 ? 'None' : plural(c.parkingSpaces, 'space', 'spaces'),
        }
      : null,
    c.publicSupplyHoursStated !== undefined
      ? {
          key: 'public-supply',
          label: 'Public supply',
          value: publicSupplyLine(c.publicSupplyHoursStated),
        }
      : null,
    c.generator !== undefined
      ? {
          key: 'generator',
          label: 'Generator',
          value: yesNo(c.generator),
          hint: c.generator ? c.generatorNote : undefined,
        }
      : null,
    c.solar !== undefined ? { key: 'solar', label: 'Solar', value: yesNo(c.solar) } : null,
    c.loadingAccess !== undefined
      ? {
          key: 'loading',
          label: 'Loading access',
          value: yesNo(c.loadingAccess),
          hint: c.loadingAccess ? c.loadingAccessNote : undefined,
        }
      : null,
  ]);

  return { lease, space, running };
}
