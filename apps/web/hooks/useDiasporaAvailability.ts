'use client';

import { useQuery } from '@tanstack/react-query';
import { unwrap } from '@/lib/apiHelpers';
import { investorKeys } from '@/lib/queryKeys';
import { investorService } from '@/services/investorService';

// Off unless the API says it is on: a failed call hides Diaspora Invest rather than offering a workspace the API would refuse.
export const useDiasporaAvailability = (): { enabled: boolean; isLoading: boolean } => {
  const query = useQuery({
    queryKey: investorKeys.availability,
    queryFn: () => unwrap(investorService.availability()),
    staleTime: 5 * 60_000,
    retry: false,
    throwOnError: false,
  });
  return { enabled: query.data?.enabled === true, isLoading: query.isLoading };
};
