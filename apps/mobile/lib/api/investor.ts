import type {
  ForeignIdentityStatus,
  InvestorAvailability,
  InvestorManaged,
  InvestorOverview,
  InvestorProfile,
  InvestorProfileInput,
  RiskDeclaration,
} from '@sureground/shared';
import { apiFetch, apiFetchOrNull } from './client';

// Sureground Diaspora Invest (the same routes as web's investorService). The shapes live in
// @sureground/shared so web and mobile read one copy.

export const investorApi = {
  /** Off until `DIASPORA_INVEST_ENABLED` is set on the API: the entry points stay hidden. */
  availability: () => apiFetch<InvestorAvailability>('/investor/availability'),
  /** Null before the first save. */
  profile: () => apiFetchOrNull<InvestorProfile>('/investor/profile'),
  saveProfile: (input: InvestorProfileInput) =>
    apiFetch<InvestorProfile>('/investor/profile', { method: 'PUT', body: input }),
  risk: () => apiFetch<RiskDeclaration>('/investor/declarations/risk'),
  /** 409 when `version` is no longer current: reload the points and ask again. */
  acceptRisk: (version: string) =>
    apiFetch<RiskDeclaration>('/investor/declarations/risk', {
      method: 'POST',
      body: { version },
    }),
  overview: () => apiFetch<InvestorOverview>('/investor/overview'),
  /** Every property under Sureground Managed, with what waits on the owner. */
  managed: () => apiFetch<InvestorManaged>('/investor/managed'),
  /** The passport, address and bank statement checks abroad (decision D3). */
  identityAbroad: () => apiFetch<ForeignIdentityStatus>('/trust/foreign-identity'),
};
