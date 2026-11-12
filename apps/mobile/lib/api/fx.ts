import type { IndicativeRates } from '@sureground/shared';
import { apiFetch } from './client';

// The same route as web's fxService.
export const fxApi = {
  indicative: () => apiFetch<IndicativeRates>('/fx/indicative'),
};
