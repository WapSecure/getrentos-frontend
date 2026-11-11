import { authFetch, safeCall, unwrapOptional, type ApiResponse } from '@/lib/apiHelpers';
import type {
  InvestorAvailability,
  InvestorOverview,
  InvestorProfile,
  InvestorProfileInput,
  RiskDeclaration,
} from '@/types/investor';

export const investorService = {
  availability(): Promise<ApiResponse<InvestorAvailability>> {
    return safeCall(() => authFetch<InvestorAvailability>('/investor/availability'));
  },

  /** Null before the first save: the API answers with an empty 200, which arrives as undefined. */
  getProfile(): Promise<InvestorProfile | null> {
    return unwrapOptional(
      safeCall(() => authFetch<InvestorProfile | null>('/investor/profile')),
      null
    );
  },

  saveProfile(input: InvestorProfileInput): Promise<ApiResponse<InvestorProfile>> {
    return safeCall(() =>
      authFetch<InvestorProfile>('/investor/profile', {
        method: 'PUT',
        body: JSON.stringify(input),
      })
    );
  },

  getRiskDeclaration(): Promise<ApiResponse<RiskDeclaration>> {
    return safeCall(() => authFetch<RiskDeclaration>('/investor/declarations/risk'));
  },

  /** 200 with the declaration; 409 when `version` is no longer current: reload the points and ask again. */
  acceptRiskDeclaration(version: string): Promise<ApiResponse<RiskDeclaration>> {
    return safeCall(() =>
      authFetch<RiskDeclaration>('/investor/declarations/risk', {
        method: 'POST',
        body: JSON.stringify({ version }),
      })
    );
  },

  getOverview(): Promise<ApiResponse<InvestorOverview>> {
    return safeCall(() => authFetch<InvestorOverview>('/investor/overview'));
  },
};
