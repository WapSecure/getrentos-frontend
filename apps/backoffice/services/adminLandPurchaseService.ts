import { authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
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
  /** Purchase reference, plot number or buyer name. */
  search?: string;
  page?: number;
  pageSize?: number;
}

const base = (purchaseId: string) => `/admin/land/purchases/${encodeURIComponent(purchaseId)}`;

/** Back-office oversight of developer plot purchases (`sales.view`). */
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

  /**
   * Waives a conveyance step: it then counts as satisfied for sequence, escrow
   * and completion (`verifications.approve`). A reason of 5+ characters is required.
   */
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

  /** Waives an unpaid late fee on one installment (`escrow.approve`). */
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

  /** Sends a failed refund, or one waiting on finance, through the gateway again (`escrow.approve`). */
  retryRefund(purchaseId: string): Promise<ApiResponse<LandPurchaseDetail>> {
    return safeCall(() => authFetch(`${base(purchaseId)}/refund/retry`, { method: 'POST' }));
  },

  // ---- Title perfection (§9.5) ----

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

  /** Decides a condition precedent: met, or not met (`verifications.approve`). */
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

  /** Approves a large release for payout to the developer's bank (`escrow.approve`). */
  approvePayout(purchaseId: string, releaseId: string): Promise<ApiResponse<LandPurchaseDetail>> {
    return safeCall(() =>
      authFetch(`${base(purchaseId)}/releases/${encodeURIComponent(releaseId)}/approve-payout`, {
        method: 'POST',
      })
    );
  },

  /** Queues a failed developer payout again (`escrow.approve`). */
  retryPayout(purchaseId: string, releaseId: string): Promise<ApiResponse<LandPurchaseDetail>> {
    return safeCall(() =>
      authFetch(`${base(purchaseId)}/releases/${encodeURIComponent(releaseId)}/retry-payout`, {
        method: 'POST',
      })
    );
  },

  /** Records naira returned to the buyer outside the gateway (`escrow.approve`). */
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
