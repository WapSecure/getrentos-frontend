import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export type AgencyCommissionType = 'LETTING' | 'RENEWAL';

export const AGENCY_COMMISSION_TYPE_LABELS: Record<AgencyCommissionType, string> = {
  LETTING: 'Letting',
  RENEWAL: 'Renewal',
};

export interface AgencyCommission {
  id: string;
  type: AgencyCommissionType;
  ownerName: string | null;
  propertyTitle: string | null;
  baseAmount: number;
  ratePct: number;
  amount: number;
  status: string;
  earnedAt: string;
}

export interface AgencyCommissionSummary {
  config: { lettingPct: number; renewalPct: number };
  totals: { earned: number; paid: number; count: number };
  commissions: AgencyCommission[];
}

export const agencyCommissionService = {
  summary(): Promise<ApiResponse<AgencyCommissionSummary>> {
    return safeCall(() => authFetch<AgencyCommissionSummary>('/agency/commissions'));
  },

  setConfig(rates: {
    lettingPct: number;
    renewalPct: number;
  }): Promise<ApiResponse<AgencyCommissionSummary>> {
    return safeCall(() =>
      authFetch<AgencyCommissionSummary>('/agency/commissions/config', {
        method: 'PUT',
        body: JSON.stringify(rates),
      })
    );
  },
};
