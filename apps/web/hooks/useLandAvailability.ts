'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch, safeCall, unwrap } from '@/lib/apiHelpers';

/** Which parts of land this environment has open (LAND_MODE on the API). */
export interface LandAvailability {
  mode: 'live' | 'onboarding' | 'off';
  /** Public land pages and buyer actions. */
  marketplace: boolean;
  /** Owners setting up parcels, diligence and estates (and outside reviewers). */
  owners: boolean;
}

const LIVE: LandAvailability = { mode: 'live', marketplace: true, owners: true };

/**
 * Land's rollout state. If the call fails land counts as open, matching the
 * API's own default, so an unreachable endpoint never hides land that is live;
 * a closed API still answers 404 behind any link that shows. Pages gate on
 * `isLoading` so they do not render before the answer.
 */
export const useLandAvailability = (): LandAvailability & { isLoading: boolean } => {
  const query = useQuery({
    queryKey: ['land', 'availability'],
    queryFn: () => unwrap(safeCall(() => authFetch<LandAvailability>('/land/availability'))),
    staleTime: 5 * 60_000,
    retry: false,
    // A non-essential check shown in the top bar and sidebars: a failure falls
    // back to LIVE above instead of taking the whole page to the error boundary.
    throwOnError: false,
  });
  return { ...(query.data ?? LIVE), isLoading: query.isLoading };
};
