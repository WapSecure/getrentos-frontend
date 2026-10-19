import type { LandClosingCondition } from '@/types/landClosing';
import { authDownload, authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';
import type {
  BuyerLandPurchaseListParams,
  LandMilestone,
  LandPaymentInit,
  LandPurchaseDetail,
  LandPurchaseSummary,
  LandReservation,
  LandSaleDocumentKind,
  LandStatement,
  PublicLandLayoutDetail,
  PublicLandLayoutListParams,
  PublicLandLayoutSummary,
} from '@/types/landBuyer';

const post = <T>(path: string, body?: unknown) =>
  authFetch<T>(path, {
    method: 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

/** Saves a blob the browser just downloaded under `filename`. */
const saveBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/** Public estate browsing (no account needed). */
export const landLayoutService = {
  list: (params: PublicLandLayoutListParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<PublicLandLayoutSummary>>(
        `/land/layouts${toQuery({
          page: params.page,
          pageSize: params.pageSize,
          search: params.search,
          city: params.city,
          state: params.state,
        })}`
      )
    ),

  get: (layoutId: string) =>
    safeCall(() => authFetch<PublicLandLayoutDetail>(`/land/layouts/${layoutId}`)),
};

/** The buyer side of developer plot sales and land resale conveyance. */
export const landBuyerService = {
  // ---- Reservations ----
  reserve: (plotId: string) =>
    safeCall(() => post<LandReservation>(`/buyer/land/plots/${plotId}/reserve`)),

  listReservations: () => safeCall(() => authFetch<LandReservation[]>('/buyer/land/reservations')),

  cancelReservation: (reservationId: string) =>
    safeCall(() => post<LandReservation>(`/buyer/land/reservations/${reservationId}/cancel`)),

  // ---- Purchases ----
  /** `acknowledgedNotVerified`: keys of the estate land's not-verified checks the buyer accepts. */
  startPurchase: (reservationId: string, planId: string, acknowledgedNotVerified: string[] = []) =>
    safeCall(() =>
      post<LandPurchaseDetail>('/buyer/land/purchases', {
        reservationId,
        planId,
        acknowledgedNotVerified,
      })
    ),

  listPurchases: (params: BuyerLandPurchaseListParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<LandPurchaseSummary>>(
        `/buyer/land/purchases${toQuery({
          page: params.page,
          pageSize: params.pageSize,
          status: params.status,
        })}`
      )
    ),

  getPurchase: (purchaseId: string) =>
    safeCall(() => authFetch<LandPurchaseDetail>(`/buyer/land/purchases/${purchaseId}`)),

  getStatement: (purchaseId: string) =>
    safeCall(() => authFetch<LandStatement>(`/buyer/land/purchases/${purchaseId}/statement`)),

  /** Pays the earliest unpaid installment unless one is named. */
  pay: (purchaseId: string, installmentId?: string) =>
    safeCall(() =>
      post<LandPaymentInit>(
        `/buyer/land/purchases/${purchaseId}/pay`,
        installmentId ? { installmentId } : {}
      )
    ),

  cancelPurchase: (purchaseId: string, reason?: string) =>
    safeCall(() =>
      post<LandPurchaseDetail>(
        `/buyer/land/purchases/${purchaseId}/cancel`,
        reason?.trim() ? { reason: reason.trim() } : {}
      )
    ),

  /** Accept a condition the developer delivered, or give one up (waive). */
  settleCondition: (purchaseId: string, key: string, how: 'confirm' | 'waive') =>
    safeCall(() =>
      post<LandPurchaseDetail>(
        `/buyer/land/purchases/${purchaseId}/conditions/${encodeURIComponent(key)}/${how}`
      )
    ),

  confirmMilestone: (purchaseId: string, key: string) =>
    safeCall(() =>
      post<LandPurchaseDetail>(
        `/buyer/land/purchases/${purchaseId}/milestones/${encodeURIComponent(key)}/confirm`
      )
    ),

  disputeMilestone: (purchaseId: string, key: string, reason: string) =>
    safeCall(() =>
      post<LandPurchaseDetail>(
        `/buyer/land/purchases/${purchaseId}/milestones/${encodeURIComponent(key)}/dispute`,
        { reason: reason.trim() }
      )
    ),

  /** Downloads the contract of sale summary or the letter of allocation (PDF). */
  downloadDocument: (purchaseId: string, kind: LandSaleDocumentKind, reference?: string) =>
    safeCall(async () => {
      const blob = await authDownload(`/buyer/land/purchases/${purchaseId}/documents/${kind}`);
      saveBlob(blob, `${reference ?? purchaseId}-${kind}.pdf`);
    }),

  // ---- Single-parcel resale conveyance ----
  /** Empty for a transaction whose property is not land. */
  listTransactionMilestones: (txId: string) =>
    safeCall(() => authFetch<LandMilestone[]>(`/buyer/land/transactions/${txId}/milestones`)),

  confirmTransactionMilestone: (txId: string, key: string) =>
    safeCall(() =>
      post<LandMilestone>(
        `/buyer/land/transactions/${txId}/milestones/${encodeURIComponent(key)}/confirm`
      )
    ),

  disputeTransactionMilestone: (txId: string, key: string, reason: string) =>
    safeCall(() =>
      post<LandMilestone>(
        `/buyer/land/transactions/${txId}/milestones/${encodeURIComponent(key)}/dispute`,
        { reason: reason.trim() }
      )
    ),

  /** Conditions precedent on a land resale (§9.3); 400 for a sale that is not land. */
  listTransactionConditions: (txId: string) =>
    safeCall(() =>
      authFetch<LandClosingCondition[]>(`/buyer/land/transactions/${txId}/conditions`)
    ),

  settleTransactionCondition: (txId: string, key: string, how: 'confirm' | 'waive') =>
    safeCall(() =>
      post<LandClosingCondition[]>(
        `/buyer/land/transactions/${txId}/conditions/${encodeURIComponent(key)}/${how}`
      )
    ),
};
