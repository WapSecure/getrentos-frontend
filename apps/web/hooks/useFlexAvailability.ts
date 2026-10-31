'use client';

import { useQuery } from '@tanstack/react-query';
import { authFetch, safeCall, unwrap } from '@/lib/apiHelpers';

/**
 * Whether GetRentos Flex is taking new plans (FLEX_NEW_PLANS_ENABLED on the API).
 * Counts as paused until the API says otherwise, so a failed check never
 * offers a sign-up the API would refuse. Existing plans are unaffected.
 */
export const useFlexAvailability = (): { newPlansOpen: boolean; isLoading: boolean } => {
  const query = useQuery({
    queryKey: ['financing', 'availability'],
    queryFn: () =>
      unwrap(safeCall(() => authFetch<{ newPlansOpen: boolean }>('/financing/availability'))),
    staleTime: 5 * 60_000,
    retry: false,
    throwOnError: false,
  });
  return { newPlansOpen: query.data?.newPlansOpen === true, isLoading: query.isLoading };
};
