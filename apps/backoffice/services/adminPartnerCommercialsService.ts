import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

/** A managed delivery partner and what it has earned. */
export interface PartnerCommercialRow {
  organizationId: string;
  name: string;
  partnerSharePct: number;
  activeMandates: number;
  earnedPartnerShare: number;
  earnedCount: number;
}

export interface PartnerCommercialSummary {
  organizationId: string;
  partnerSharePct: number;
  totals: { grossFee: number; partnerShare: number; platformShare: number; count: number };
  earned: { partnerShare: number; count: number };
  paid: { partnerShare: number; count: number };
  recent: {
    id: string;
    propertyId: string;
    grossFee: number;
    partnerSharePct: number;
    partnerShareAmount: number;
    platformShareAmount: number;
    status: string;
    createdAt: string;
  }[];
}

export const adminPartnerCommercialsService = {
  list(): Promise<ApiResponse<PartnerCommercialRow[]>> {
    return safeCall(() => authFetch<PartnerCommercialRow[]>('/admin/partner-commercials'));
  },
  summary(organizationId: string): Promise<ApiResponse<PartnerCommercialSummary>> {
    return safeCall(() =>
      authFetch<PartnerCommercialSummary>(`/admin/partner-commercials/${organizationId}`)
    );
  },
  setConfig(
    organizationId: string,
    partnerSharePct: number
  ): Promise<ApiResponse<{ organizationId: string; partnerSharePct: number }>> {
    return safeCall(() =>
      authFetch(`/admin/partner-commercials/${organizationId}/config`, {
        method: 'PUT',
        body: JSON.stringify({ partnerSharePct }),
      })
    );
  },
  listPayouts(organizationId: string): Promise<ApiResponse<PartnerPayout[]>> {
    return safeCall(() =>
      authFetch<PartnerPayout[]>(`/admin/partner-commercials/${organizationId}/payouts`)
    );
  },
  requestPayout(organizationId: string): Promise<ApiResponse<PartnerPayout>> {
    return safeCall(() =>
      authFetch(`/admin/partner-commercials/${organizationId}/payout`, { method: 'POST' })
    );
  },
};

export interface PartnerPayout {
  id: string;
  amount: number;
  status: string;
  commissions: number;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
}
