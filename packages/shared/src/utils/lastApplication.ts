/** The employment statuses both application forms offer. */
export const EMPLOYMENT_STATUSES = [
  'Employed',
  'Self-employed',
  'Business owner',
  'Student',
] as const;

/**
 * What a renter told us on their latest application (GET
 * /renter/applications/last-details), used to start the next one filled in.
 */
export interface LastApplicationDetails {
  phone?: string;
  currentAddress?: string;
  /** The Google place the current address was picked from; absent for a typed one. */
  currentAddressPlaceId?: string | null;
  monthlyIncome?: number;
  employmentStatus?: string;
  employer?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelationship?: string;
  reference?: { name: string; phone: string; relationship: string };
}

/** The application form fields this can fill; both apps' forms have them as strings. */
export interface PrefillableApplicationFields {
  phone: string;
  currentAddress: string;
  monthlyIncome: string;
  employmentStatus: string;
  employer: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
  referenceName: string;
  referencePhone: string;
  referenceRelationship: string;
  /** Set when the form keeps the place a picked current address came from. */
  currentAddressPlaceId?: string;
}

/**
 * Fills a form's still-empty fields from the last application. Anything the
 * renter has already typed (or a draft restored) wins; employment status is
 * taken from last time because the form only defaults it, but only when it is
 * one the form offers.
 */
export function applyLastApplication<T extends PrefillableApplicationFields>(
  form: T,
  last: LastApplicationDetails | null | undefined
): T {
  if (!last) return form;
  const keep = (current: string, next?: string | null) =>
    current.trim() ? current : (next ?? current);
  // The place id travels with the address it belongs to, never on its own.
  const fillsAddress = !form.currentAddress.trim() && !!last.currentAddress;
  return {
    ...form,
    phone: keep(form.phone, last.phone),
    currentAddress: keep(form.currentAddress, last.currentAddress),
    ...(fillsAddress ? { currentAddressPlaceId: last.currentAddressPlaceId ?? undefined } : {}),
    monthlyIncome: keep(
      form.monthlyIncome,
      last.monthlyIncome ? String(last.monthlyIncome) : undefined
    ),
    employmentStatus: (EMPLOYMENT_STATUSES as readonly string[]).includes(
      last.employmentStatus ?? ''
    )
      ? last.employmentStatus!
      : form.employmentStatus,
    employer: keep(form.employer, last.employer),
    nextOfKinName: keep(form.nextOfKinName, last.nextOfKinName),
    nextOfKinPhone: keep(form.nextOfKinPhone, last.nextOfKinPhone),
    nextOfKinRelationship: keep(form.nextOfKinRelationship, last.nextOfKinRelationship),
    referenceName: keep(form.referenceName, last.reference?.name),
    referencePhone: keep(form.referencePhone, last.reference?.phone),
    referenceRelationship: keep(form.referenceRelationship, last.reference?.relationship),
  };
}
