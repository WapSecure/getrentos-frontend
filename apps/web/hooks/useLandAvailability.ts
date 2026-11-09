'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch, safeCall, unwrap } from '@/lib/apiHelpers';

export interface LandAvailability {
  mode: 'live' | 'onboarding' | 'off';
  marketplace: boolean;
  owners: boolean;
}

const LIVE: LandAvailability = { mode: 'live', marketplace: true, owners: true };

// A failed call counts as open, matching the API's default, so an outage never hides live land; pages wait for `isLoading`.
export const useLandAvailability = (): LandAvailability & { isLoading: boolean } => {
  const query = useQuery({
    queryKey: ['land', 'availability'],
    queryFn: () => unwrap(safeCall(() => authFetch<LandAvailability>('/land/availability'))),
    staleTime: 5 * 60_000,
    retry: false,
    throwOnError: false,
  });
  return { ...(query.data ?? LIVE), isLoading: query.isLoading };
};
