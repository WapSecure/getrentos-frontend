import { authFetch, safeCall } from '@/lib/apiHelpers';
import type { ApiResponse } from '@/lib/apiHelpers';

export interface LocationCountry {
  code: string;
  name: string;
  states: string[];
}

// ---- Public country/state reference data (used in signup + profile forms) ----

export async function listLocations(): Promise<ApiResponse<LocationCountry[]>> {
  return safeCall(() => authFetch<LocationCountry[]>('/geo/locations'));
}

export async function listCountries(): Promise<ApiResponse<{ code: string; name: string }[]>> {
  return safeCall(() => authFetch<{ code: string; name: string }[]>('/geo/countries'));
}

export async function listCountryStates(countryCode: string): Promise<ApiResponse<string[]>> {
  return safeCall(() => authFetch<string[]>(`/geo/countries/${countryCode}/states`));
}
