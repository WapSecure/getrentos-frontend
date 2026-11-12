import { useQuery } from '@tanstack/react-query';
import { UNAVAILABLE_RATES, type IndicativeRates } from '@sureground/shared';
import { fxApi } from '@/lib/api/fx';
import { qk } from '@/lib/query/keys';

/** Any failure counts as unavailable, so a screen falls back to naira only and never shows a guess. */
export function useIndicativeRates(): IndicativeRates {
  const query = useQuery({
    queryKey: qk.fx.indicative,
    queryFn: fxApi.indicative,
    staleTime: 30 * 60_000,
    retry: false,
  });
  return query.data?.available ? query.data : UNAVAILABLE_RATES;
}
