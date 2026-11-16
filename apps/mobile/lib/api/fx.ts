import type { IndicativeRates } from '@sureground/shared';
import { apiFetch } from './client';

export const fxApi = {
  indicative: () => apiFetch<IndicativeRates>('/fx/indicative'),
};
