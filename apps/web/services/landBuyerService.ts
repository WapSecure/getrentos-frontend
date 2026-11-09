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
import { providerQuery } from '@/services/paymentStatusService';
import type { PaymentProvider } from '@/types/payments';

const post = <T>(path: string, body?: unknown) =>
  authFetch<T>(path, {
    method: 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

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

export const landBuyerService = {
  reserve: (
    plotId: string,
    input: { acceptedTermsVersion: string; subjectToInspectionId?: string }
  ) =>
    safeCall(() =>
      post<LandReservation>(`/buyer/land/plots/${plotId}/reserve`, {
        acceptedTermsVersion: input.acceptedTermsVersion,
        ...(input.subjectToInspectionId
          ? { subjectToInspectionId: input.subjectToInspectionId }
          : {}),
      })
    ),

  listReservations: () => safeCall(() => authFetch<LandReservation[]>('/buyer/land/reservations')),

  cancelReservation: (reservationId: string) =>
    safeCall(() => post<LandReservation>(`/buyer/land/reservations/${reservationId}/cancel`)),

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
  pay: (purchaseId: string, installmentId?: string, provider?: PaymentProvider) =>
    safeCall(() =>
      post<LandPaymentInit>(
        `/buyer/land/purchases/${purchaseId}/pay${providerQuery(provider)}`,
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

  downloadDocument: (purchaseId: string, kind: LandSaleDocumentKind, reference?: string) =>
    safeCall(async () => {
      const blob = await authDownload(`/buyer/land/purchases/${purchaseId}/documents/${kind}`);
      saveBlob(blob, `${reference ?? purchaseId}-${kind}.pdf`);
    }),

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

  /** 400 for a sale that is not land. */
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
