import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { IndicativeRates } from '@sureground/shared';

export { UNAVAILABLE_RATES, type IndicativeRates } from '@sureground/shared';

export function getIndicativeRates(): Promise<ApiResponse<IndicativeRates>> {
  return safeCall(() => authFetch<IndicativeRates>('/fx/indicative'));
}
