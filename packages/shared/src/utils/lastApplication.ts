export const EMPLOYMENT_STATUSES = [
  'Employed',
  'Self-employed',
  'Business owner',
  'Student',
] as const;

export interface LastApplicationDetails {
  phone?: string;
  currentAddress?: string;
  currentAddressPlaceId?: string | null;
  monthlyIncome?: number;
  employmentStatus?: string;
  employer?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinRelationship?: string;
  reference?: { name: string; phone: string; relationship: string };
}

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
  currentAddressPlaceId?: string;
}

// Anything already typed or restored wins; employment status comes from last time (the form only
// defaults it) when it is one the form offers.
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
