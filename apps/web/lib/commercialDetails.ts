import type {
  CommercialDetails,
  CommercialFitOutCondition,
  CommercialPermittedUse,
} from '@sureground/shared/showroom';

export type Stated = '' | 'yes' | 'no';

/** Form state: '' always means "not stated". */
export interface CommercialValues {
  permittedUse: CommercialPermittedUse | '';
  permittedUseNote: string;
  lettableAreaSqm: string;
  fitOutCondition: CommercialFitOutCondition | '';
  parkingSpaces: string;
  publicSupplyHoursStated: string;
  generator: Stated;
  generatorNote: string;
  solar: Stated;
  loadingAccess: Stated;
  loadingAccessNote: string;
  leaseTermOptionsYears: number[];
  rentReviewNote: string;
  escalationNote: string;
  vatStatedPct: string;
  vatIncluded: Stated;
}

export const EMPTY_COMMERCIAL: CommercialValues = {
  permittedUse: '',
  permittedUseNote: '',
  lettableAreaSqm: '',
  fitOutCondition: '',
  parkingSpaces: '',
  publicSupplyHoursStated: '',
  generator: '',
  generatorNote: '',
  solar: '',
  loadingAccess: '',
  loadingAccessNote: '',
  leaseTermOptionsYears: [],
  rentReviewNote: '',
  escalationNote: '',
  vatStatedPct: '',
  vatIncluded: '',
};

/** The API's limits, so the form says what is wrong before the save does. */
export const COMMERCIAL_LIMITS = {
  shortNote: 200,
  leaseNote: 500,
  maxAreaSqm: 1_000_000,
  maxParking: 10_000,
} as const;

export type CommercialDeal = 'rent' | 'sale';

/** Who reads the stated details, and what the VAT question is about: the rent on a let, the price on a sale. */
export const commercialDealCopy = (deal: CommercialDeal = 'rent') =>
  deal === 'sale'
    ? { audience: 'Buyers', amount: 'Price' }
    : { audience: 'Renters', amount: 'Rent' };

/** Lease lengths offered as chips, in years. */
export const LEASE_TERM_CHOICES = [1, 2, 3, 5, 7, 10, 15, 20, 25];

/** The API's limits on lease terms: whole years from 1 to 99, no repeats, at most 10. */
export const LEASE_TERM_LIMITS = { min: 1, max: 99, count: 10 } as const;

const WHOLE = /^\d+$/;

/** Adds a lease length typed into the "Other" box, or says why it can't be added. */
export function addLeaseTerm(
  current: number[],
  raw: string
): { years: number[]; error?: undefined } | { error: string } {
  const typed = raw.trim();
  if (typed === '') return { error: 'Enter a number of years.' };
  const years = Number(typed);
  if (!WHOLE.test(typed) || years < LEASE_TERM_LIMITS.min || years > LEASE_TERM_LIMITS.max)
    return { error: 'A lease term must be a whole number of years from 1 to 99.' };
  if (current.includes(years)) return { error: 'That lease term is already on the list.' };
  if (current.length >= LEASE_TERM_LIMITS.count)
    return { error: 'You can offer at most 10 lease terms.' };
  return { years: [...current, years].sort((a, b) => a - b) };
}

const toStated = (v?: boolean): Stated => (v === undefined ? '' : v ? 'yes' : 'no');
const fromStated = (v: Stated) => (v === '' ? undefined : v === 'yes');
const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
const str = (v: string) => (v.trim() === '' ? undefined : v.trim());

export const commercialFromDetails = (d?: CommercialDetails): CommercialValues => ({
  permittedUse: d?.permittedUse ?? '',
  permittedUseNote: d?.permittedUseNote ?? '',
  lettableAreaSqm: d?.lettableAreaSqm === undefined ? '' : String(d.lettableAreaSqm),
  fitOutCondition: d?.fitOutCondition ?? '',
  parkingSpaces: d?.parkingSpaces === undefined ? '' : String(d.parkingSpaces),
  publicSupplyHoursStated:
    d?.publicSupplyHoursStated === undefined ? '' : String(d.publicSupplyHoursStated),
  generator: toStated(d?.generator),
  generatorNote: d?.generatorNote ?? '',
  solar: toStated(d?.solar),
  loadingAccess: toStated(d?.loadingAccess),
  loadingAccessNote: d?.loadingAccessNote ?? '',
  leaseTermOptionsYears: d?.leaseTermOptionsYears ?? [],
  rentReviewNote: d?.rentReviewNote ?? '',
  escalationNote: d?.escalationNote ?? '',
  vatStatedPct: d?.vatStatedPct === undefined ? '' : String(d.vatStatedPct),
  vatIncluded: toStated(d?.vatIncluded),
});

/** Only what is stated; undefined when nothing is. Used on create. */
export function commercialToCreatePayload(v: CommercialValues): CommercialDetails | undefined {
  const payload: CommercialDetails = {
    permittedUse: v.permittedUse || undefined,
    permittedUseNote: str(v.permittedUseNote),
    lettableAreaSqm: num(v.lettableAreaSqm),
    fitOutCondition: v.fitOutCondition || undefined,
    parkingSpaces: num(v.parkingSpaces),
    publicSupplyHoursStated: num(v.publicSupplyHoursStated),
    generator: fromStated(v.generator),
    generatorNote: v.generator === 'yes' ? str(v.generatorNote) : undefined,
    solar: fromStated(v.solar),
    loadingAccess: fromStated(v.loadingAccess),
    loadingAccessNote: v.loadingAccess === 'yes' ? str(v.loadingAccessNote) : undefined,
    leaseTermOptionsYears: v.leaseTermOptionsYears.length
      ? [...v.leaseTermOptionsYears].sort((a, b) => a - b)
      : undefined,
    rentReviewNote: str(v.rentReviewNote),
    escalationNote: str(v.escalationNote),
    vatStatedPct: num(v.vatStatedPct),
    vatIncluded: fromStated(v.vatIncluded),
  };
  const stated = Object.fromEntries(
    Object.entries(payload).filter(([, x]) => x !== undefined)
  ) as CommercialDetails;
  return Object.keys(stated).length ? stated : undefined;
}

export type CommercialUpdatePayload = {
  [K in keyof CommercialDetails]-?: CommercialDetails[K] | null;
};

/** Every field, with null for "not stated", so clearing a box clears it on the listing. */
export function commercialToUpdatePayload(v: CommercialValues): CommercialUpdatePayload {
  const stated = commercialToCreatePayload(v) ?? {};
  const keys = Object.keys(EMPTY_COMMERCIAL) as (keyof CommercialValues)[];
  return Object.fromEntries(
    keys.map((k) => [k, k === 'leaseTermOptionsYears' ? (stated[k] ?? []) : (stated[k] ?? null)])
  ) as CommercialUpdatePayload;
}

// A trailing dot is what NumberInput shows mid-typing, so it is allowed.
const TWO_DECIMALS = /^\d+(?:\.\d{0,2})?$/;

/** The first problem in the form, in the API's words; null when it can be saved. */
export function commercialError(v: CommercialValues): string | null {
  const terms = v.leaseTermOptionsYears;
  if (
    terms.some(
      (y) => !Number.isInteger(y) || y < LEASE_TERM_LIMITS.min || y > LEASE_TERM_LIMITS.max
    )
  )
    return 'A lease term must be a whole number of years from 1 to 99.';
  if (new Set(terms).size !== terms.length) return 'Each lease term can be listed once.';
  if (terms.length > LEASE_TERM_LIMITS.count) return 'You can offer at most 10 lease terms.';
  const area = num(v.lettableAreaSqm);
  if (area !== undefined && !(area >= 1 && area <= COMMERCIAL_LIMITS.maxAreaSqm))
    return 'Lettable area must be between 1 and 1,000,000 m².';
  if (area !== undefined && !TWO_DECIMALS.test(v.lettableAreaSqm.trim()))
    return 'Lettable area can have at most two decimal places.';
  const parking = num(v.parkingSpaces);
  if (parking !== undefined && parking > COMMERCIAL_LIMITS.maxParking)
    return 'Parking can be at most 10,000 spaces.';
  const hours = num(v.publicSupplyHoursStated);
  if (hours !== undefined && hours > 24)
    return 'Public supply hours must be between 0 and 24 a day.';
  const vat = num(v.vatStatedPct);
  if (vat !== undefined && !(vat >= 0 && vat <= 100)) return 'VAT must be between 0% and 100%.';
  if (vat !== undefined && !TWO_DECIMALS.test(v.vatStatedPct.trim()))
    return 'VAT can have at most two decimal places.';
  return null;
}
