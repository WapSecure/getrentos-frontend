import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { IndicativeCurrency } from '@sureground/shared';

/**
 * `GET /fx/indicative` (public). `rates` is 1 NGN in each currency. `available: false` means the
 * rate source is not set up, is down, or its rate is over 24 hours old: show naira only.
 */
export interface IndicativeRates {
  available: boolean;
  source: string | null;
  asOf: string | null;
  rates: Partial<Record<IndicativeCurrency, number>>;
}

export const UNAVAILABLE_RATES: IndicativeRates = {
  available: false,
  source: null,
  asOf: null,
  rates: {},
};

export function getIndicativeRates(): Promise<ApiResponse<IndicativeRates>> {
  return safeCall(() => authFetch<IndicativeRates>('/fx/indicative'));
}
