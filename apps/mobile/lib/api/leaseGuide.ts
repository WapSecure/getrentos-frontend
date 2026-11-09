import { apiFetch } from './client';

export interface LeaseGuide {
  summary: string[];
  renewalAdvice: string | null;
  termsToAsk: string[];
  counterOfferDraft: string | null;
  facts: { notices: { kind: string; served: string | null; expires: string | null }[] };
  source: 'ai' | 'heuristic';
  disclaimer: string;
}

export const leaseGuideApi = {
  get: () => apiFetch<LeaseGuide>('/renter/lease/guide'),
};
