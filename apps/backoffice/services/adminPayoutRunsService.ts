import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

export interface PayoutRunSummary {
  id: string;
  period: string;
  status: 'DRAFTED' | 'ISSUED';
  createdById: string;
  issuedById: string | null;
  createdAt: string;
  issuedAt: string | null;
  owners: number;
  total: number;
  failed: number;
}

export interface PayoutRun {
  id: string;
  period: string;
  status: 'DRAFTED' | 'ISSUED';
  createdById: string;
  issuedById: string | null;
  createdAt: string;
  issuedAt: string | null;
  items: {
    id: string;
    ownerId: string;
    ownerName: string;
    statementId: string | null;
    status: 'DRAFTED' | 'SKIPPED' | 'ISSUED' | 'FAILED';
    note: string | null;
    grossIncome: number | null;
    netPayout: number | null;
    statementStatus: string | null;
    payoutStatus: string | null;
  }[];
}

export const adminPayoutRunsService = {
  list: (): Promise<ApiResponse<PayoutRunSummary[]>> =>
    safeCall(() => authFetch<PayoutRunSummary[]>('/admin/payout-runs')),
  get: (id: string): Promise<ApiResponse<PayoutRun>> =>
    safeCall(() => authFetch<PayoutRun>(`/admin/payout-runs/${id}`)),
  draft: (period: string): Promise<ApiResponse<PayoutRun>> =>
    safeCall(() =>
      authFetch<PayoutRun>('/admin/payout-runs', {
        method: 'POST',
        body: JSON.stringify({ period }),
      })
    ),
  issue: (id: string): Promise<ApiResponse<PayoutRun>> =>
    safeCall(() => authFetch<PayoutRun>(`/admin/payout-runs/${id}/issue`, { method: 'POST' })),
  retryItem: (id: string, itemId: string): Promise<ApiResponse<PayoutRun>> =>
    safeCall(() =>
      authFetch<PayoutRun>(`/admin/payout-runs/${id}/items/${itemId}/retry`, { method: 'POST' })
    ),
};
