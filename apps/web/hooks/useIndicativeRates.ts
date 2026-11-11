'use client';

import { useQuery } from '@tanstack/react-query';
import { fxKeys } from '@/lib/queryKeys';
import { getIndicativeRates, UNAVAILABLE_RATES, type IndicativeRates } from '@/services/fxService';

/** Any failure counts as unavailable, so a page falls back to naira only and never shows a guess. */
export const useIndicativeRates = (): IndicativeRates => {
  const query = useQuery({
    queryKey: fxKeys.indicative,
    queryFn: async () => {
      const response = await getIndicativeRates();
      return response.success && response.data ? response.data : UNAVAILABLE_RATES;
    },
    staleTime: 30 * 60_000,
    retry: false,
    throwOnError: false,
  });
  return query.data?.available ? query.data : UNAVAILABLE_RATES;
};
