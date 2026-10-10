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

export interface AgencyPayoutAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  verified: boolean;
}

export interface AgencyPayoutSummary {
  available: number;
  accountSet: boolean;
}

export interface AgencyPayout {
  id: string;
  amount: number;
  status: string;
  commissions: number;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
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

  getPayoutAccount(): Promise<ApiResponse<AgencyPayoutAccount>> {
    return safeCall(() => authFetch<AgencyPayoutAccount>('/agency/commissions/payout-account'));
  },

  savePayoutAccount(input: {
    bankCode: string;
    accountNumber: string;
  }): Promise<ApiResponse<AgencyPayoutAccount>> {
    return safeCall(() =>
      authFetch<AgencyPayoutAccount>('/agency/commissions/payout-account', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  payoutSummary(): Promise<ApiResponse<AgencyPayoutSummary>> {
    return safeCall(() => authFetch<AgencyPayoutSummary>('/agency/commissions/payouts/summary'));
  },

  listPayouts(): Promise<ApiResponse<AgencyPayout[]>> {
    return safeCall(() => authFetch<AgencyPayout[]>('/agency/commissions/payouts'));
  },

  requestPayout(): Promise<ApiResponse<AgencyPayout>> {
    return safeCall(() =>
      authFetch<AgencyPayout>('/agency/commissions/payouts/request', { method: 'POST' })
    );
  },
};
