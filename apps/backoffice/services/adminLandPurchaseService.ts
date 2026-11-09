import { authFetch, safeCall, toQuery } from '@sureground/shared';
import type { ApiResponse } from '@sureground/shared';
import type { Paginated } from '@/services/adminService';
import type {
  LandPurchaseDetail,
  LandPurchaseStatus,
  LandPurchaseSummary,
  LandPerfectionQueueItem,
  LandPerfectionStep,
} from '@/types/landPurchase';

export interface ListAdminLandPurchasesParams {
  status?: LandPurchaseStatus;
  layoutId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

const base = (purchaseId: string) => `/admin/land/purchases/${encodeURIComponent(purchaseId)}`;

export const adminLandPurchaseService = {
  list(
    params: ListAdminLandPurchasesParams = {}
  ): Promise<ApiResponse<Paginated<LandPurchaseSummary>>> {
    const query = toQuery({
      status: params.status,
      layoutId: params.layoutId,
      search: params.search,
      page: params.page,
      pageSize: params.pageSize,
    });
    return safeCall(() => authFetch(`/admin/land/purchases${query}`));
  },

  detail(purchaseId: string): Promise<ApiResponse<LandPurchaseDetail>> {
    return safeCall(() => authFetch(base(purchaseId)));
  },

  // A waived step counts as satisfied for sequence, escrow and completion.
  waiveMilestone(
    purchaseId: string,
    key: string,
    reason: string
  ): Promise<ApiResponse<LandPurchaseDetail>> {
    return safeCall(() =>
      authFetch(`${base(purchaseId)}/milestones/${encodeURIComponent(key)}/waive`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() }),
      })
    );
  },

  waiveLateFee(
    purchaseId: string,
    installmentId: string,
    reason: string
  ): Promise<ApiResponse<LandPurchaseDetail>> {
    return safeCall(() =>
      authFetch(
        `${base(purchaseId)}/installments/${encodeURIComponent(installmentId)}/waive-late-fee`,
        { method: 'POST', body: JSON.stringify({ reason: reason.trim() }) }
      )
    );
  },

  retryRefund(purchaseId: string): Promise<ApiResponse<LandPurchaseDetail>> {
    return safeCall(() => authFetch(`${base(purchaseId)}/refund/retry`, { method: 'POST' }));
  },

  perfectionQueue(): Promise<ApiResponse<LandPerfectionQueueItem[]>> {
    return safeCall(() => authFetch('/admin/land/purchases/perfection'));
  },
  openPerfection(purchaseId: string): Promise<ApiResponse<LandPurchaseDetail>> {
    return safeCall(() => authFetch(`${base(purchaseId)}/perfection/open`, { method: 'POST' }));
  },
  assignPerfectionProfessional(
    purchaseId: string,
    input: { name: string; firm?: string; contact?: string }
  ): Promise<ApiResponse<LandPurchaseDetail>> {
    return safeCall(() =>
      authFetch(`${base(purchaseId)}/perfection/professional`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },
  updatePerfectionStep(
    purchaseId: string,
    key: string,
    input: { status: LandPerfectionStep['status']; reference?: string; note?: string }
  ): Promise<ApiResponse<LandPurchaseDetail>> {
    return safeCall(() =>
      authFetch(`${base(purchaseId)}/perfection/steps/${encodeURIComponent(key)}`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },
  completePerfection(
    purchaseId: string,
    input: { finalInstrumentReference: string; legalReview: string }
  ): Promise<ApiResponse<LandPurchaseDetail>> {
    return safeCall(() =>
      authFetch(`${base(purchaseId)}/perfection/complete`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  decideCondition(
    purchaseId: string,
    key: string,
    status: 'SATISFIED' | 'FAILED',
    note: string
  ): Promise<ApiResponse<LandPurchaseDetail>> {
    return safeCall(() =>
      authFetch(`${base(purchaseId)}/conditions/${encodeURIComponent(key)}/decide`, {
        method: 'POST',
        body: JSON.stringify({ status, note: note.trim() }),
      })
    );
  },

  approvePayout(purchaseId: string, releaseId: string): Promise<ApiResponse<LandPurchaseDetail>> {
    return safeCall(() =>
      authFetch(`${base(purchaseId)}/releases/${encodeURIComponent(releaseId)}/approve-payout`, {
        method: 'POST',
      })
    );
  },

  retryPayout(purchaseId: string, releaseId: string): Promise<ApiResponse<LandPurchaseDetail>> {
    return safeCall(() =>
      authFetch(`${base(purchaseId)}/releases/${encodeURIComponent(releaseId)}/retry-payout`, {
        method: 'POST',
      })
    );
  },

  settleRefund(
    purchaseId: string,
    amount: number,
    note: string
  ): Promise<ApiResponse<LandPurchaseDetail>> {
    return safeCall(() =>
      authFetch(`${base(purchaseId)}/refund/settle`, {
        method: 'POST',
        body: JSON.stringify({ amount, note: note.trim() }),
      })
    );
  },
};
