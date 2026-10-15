import { authDownload, authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';
import type {
  LandCollectionsSummary,
  LandInventoryDashboard,
  LandLayoutInput,
  LandMilestone,
  LandMilestoneDeliverInput,
  LandPaymentPlan,
  LandPaymentPlanInput,
  LandPaymentPlanUpdateInput,
  LandPlot,
  LandPlotImportResult,
  LandPlotInput,
  LandPlotStatus,
  LandPlotUpdateInput,
  LandPurchaseDetail,
  LandPurchaseSummary,
  LandResaleSummary,
  LandRiskAssessment,
  LandSaleDocumentKind,
  LandSellerAnalytics,
  LandTitleEvent,
  LandTitleEventInput,
  OwnerLandLayout,
  OwnerLandLayoutSummary,
  SellerLandPurchaseListParams,
} from '@/types/landDeveloper';
import type { LandDocument, LandDocumentUploadInput } from '@/types/landDocument';

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

const layoutPath = (propertyId: string) => `/owner/land/${encodeURIComponent(propertyId)}/layout`;
const documentsPath = (propertyId: string) =>
  `/owner/land/${encodeURIComponent(propertyId)}/documents`;

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

/**
 * The seller side of land: a developer's estate layout (plots, payment plans,
 * inventory), the plot sales desk, single-parcel resale conveyance, and the
 * insight / chain-of-title endpoints for one land property.
 */
export const landDeveloperService = {
  // ─── Layout ────────────────────────────────────────────────────────────────

  /** Every layout the caller can sell from: owned outright or under a listing mandate. */
  listMyLayouts: () => safeCall(() => authFetch<OwnerLandLayoutSummary[]>('/owner/land/layouts')),

  /** 404 when the parcel has no layout yet; pair with `unwrapOptional`. */
  getLayout: (propertyId: string) =>
    safeCall(() => authFetch<OwnerLandLayout>(layoutPath(propertyId))),

  createLayout: (propertyId: string, input: LandLayoutInput) =>
    safeCall(() => authFetch<OwnerLandLayout>(layoutPath(propertyId), json('POST', input))),

  updateLayout: (propertyId: string, input: Partial<LandLayoutInput>) =>
    safeCall(() => authFetch<OwnerLandLayout>(layoutPath(propertyId), json('PATCH', input))),

  publishLayout: (propertyId: string) =>
    safeCall(() => authFetch<OwnerLandLayout>(`${layoutPath(propertyId)}/publish`, json('POST'))),

  closeLayout: (propertyId: string) =>
    safeCall(() => authFetch<OwnerLandLayout>(`${layoutPath(propertyId)}/close`, json('POST'))),

  getDashboard: (propertyId: string) =>
    safeCall(() => authFetch<LandInventoryDashboard>(`${layoutPath(propertyId)}/dashboard`)),

  // ─── Plots ─────────────────────────────────────────────────────────────────

  listPlots: (propertyId: string, params: { status?: LandPlotStatus; block?: string } = {}) =>
    safeCall(() =>
      authFetch<LandPlot[]>(
        `${layoutPath(propertyId)}/plots${toQuery({ status: params.status, block: params.block })}`
      )
    ),

  addPlot: (propertyId: string, input: LandPlotInput) =>
    safeCall(() => authFetch<LandPlot>(`${layoutPath(propertyId)}/plots`, json('POST', input))),

  /**
   * All-or-nothing. A rejection carries `errors: [{ index, plotNumber, errors }]`
   * in the error details when the API forwards it.
   */
  importPlots: (propertyId: string, rows: LandPlotInput[]) =>
    safeCall(() =>
      authFetch<LandPlotImportResult>(
        `${layoutPath(propertyId)}/plots/import`,
        json('POST', { rows })
      )
    ),

  updatePlot: (propertyId: string, plotId: string, input: LandPlotUpdateInput) =>
    safeCall(() =>
      authFetch<LandPlot>(`${layoutPath(propertyId)}/plots/${plotId}`, json('PATCH', input))
    ),

  withholdPlot: (propertyId: string, plotId: string) =>
    safeCall(() =>
      authFetch<LandPlot>(`${layoutPath(propertyId)}/plots/${plotId}/withhold`, json('POST'))
    ),

  releasePlot: (propertyId: string, plotId: string) =>
    safeCall(() =>
      authFetch<LandPlot>(`${layoutPath(propertyId)}/plots/${plotId}/release`, json('POST'))
    ),

  // ─── Payment plans ─────────────────────────────────────────────────────────

  createPlan: (propertyId: string, input: LandPaymentPlanInput) =>
    safeCall(() =>
      authFetch<LandPaymentPlan>(`${layoutPath(propertyId)}/plans`, json('POST', input))
    ),

  updatePlan: (propertyId: string, planId: string, input: LandPaymentPlanUpdateInput) =>
    safeCall(() =>
      authFetch<LandPaymentPlan>(`${layoutPath(propertyId)}/plans/${planId}`, json('PATCH', input))
    ),

  // ─── Sales desk ────────────────────────────────────────────────────────────

  listPurchases: (params: SellerLandPurchaseListParams = {}) =>
    safeCall(() =>
      authFetch<Paginated<LandPurchaseSummary>>(
        `/owner/land/purchases${toQuery({
          page: params.page,
          pageSize: params.pageSize,
          status: params.status,
          layoutId: params.layoutId,
          search: params.search,
        })}`
      )
    ),

  getCollections: (layoutId?: string) =>
    safeCall(() =>
      authFetch<LandCollectionsSummary>(`/owner/land/purchases/collections${toQuery({ layoutId })}`)
    ),

  getPurchase: (purchaseId: string) =>
    safeCall(() => authFetch<LandPurchaseDetail>(`/owner/land/purchases/${purchaseId}`)),

  revokePurchase: (purchaseId: string, reason: string) =>
    safeCall(() =>
      authFetch<LandPurchaseDetail>(
        `/owner/land/purchases/${purchaseId}/revoke`,
        json('POST', { reason })
      )
    ),

  /** Mark a condition precedent met (layout approval, plot identified on site). */
  deliverCondition: (
    purchaseId: string,
    key: string,
    input: { note?: string; documentId?: string }
  ) =>
    safeCall(() =>
      authFetch<LandPurchaseDetail>(
        `/owner/land/purchases/${purchaseId}/conditions/${encodeURIComponent(key)}/deliver`,
        json('POST', input)
      )
    ),

  deliverPurchaseMilestone: (purchaseId: string, key: string, input: LandMilestoneDeliverInput) =>
    safeCall(() =>
      authFetch<LandPurchaseDetail>(
        `/owner/land/purchases/${purchaseId}/milestones/${encodeURIComponent(key)}/deliver`,
        json('POST', input)
      )
    ),

  downloadSaleDocument: (purchaseId: string, kind: LandSaleDocumentKind, reference?: string) =>
    safeCall(async () => {
      const blob = await authDownload(`/owner/land/purchases/${purchaseId}/documents/${kind}`);
      saveBlob(blob, `${reference ?? 'land-purchase'}-${kind}.pdf`);
    }),

  // ─── Resale conveyance ─────────────────────────────────────────────────────

  /** 400 for a transaction that is not a land sale. */
  /** The resale being conveyed: its property (for document pickers), buyer and escrow state. */
  getResale: (txId: string) =>
    safeCall(() => authFetch<LandResaleSummary>(`/owner/land/transactions/${txId}`)),

  listTransactionMilestones: (txId: string) =>
    safeCall(() => authFetch<LandMilestone[]>(`/owner/land/transactions/${txId}/milestones`)),

  deliverTransactionMilestone: (txId: string, key: string, input: LandMilestoneDeliverInput) =>
    safeCall(() =>
      authFetch<LandMilestone>(
        `/owner/land/transactions/${txId}/milestones/${encodeURIComponent(key)}/deliver`,
        json('POST', input)
      )
    ),

  // ─── Property documents ────────────────────────────────────────────────────

  /** Newest first, each with a short-lived preview link and where it is used. */
  listDocuments: (propertyId: string) =>
    safeCall(() => authFetch<LandDocument[]>(documentsPath(propertyId))),

  /** Multipart; the browser sets the boundary, so no Content-Type here. */
  uploadDocument: (propertyId: string, input: LandDocumentUploadInput) => {
    const form = new FormData();
    form.append('file', input.file);
    form.append('documentType', input.documentType);
    return safeCall(() =>
      authFetch<LandDocument>(documentsPath(propertyId), { method: 'POST', body: form })
    );
  },

  /** Refused (400) while anything cites the document. */
  deleteDocument: (propertyId: string, documentId: string) =>
    safeCall(() =>
      authFetch<void>(`${documentsPath(propertyId)}/${encodeURIComponent(documentId)}`, {
        method: 'DELETE',
      })
    ),

  // ─── Insights and chain of title ───────────────────────────────────────────

  getSellerAnalytics: (propertyId: string) =>
    safeCall(() =>
      authFetch<LandSellerAnalytics>(`/owner/land/${encodeURIComponent(propertyId)}/analytics`)
    ),

  getRisk: (propertyId: string) =>
    safeCall(() =>
      authFetch<LandRiskAssessment>(`/owner/land/${encodeURIComponent(propertyId)}/risk`)
    ),

  listTitleHistory: (propertyId: string) =>
    safeCall(() =>
      authFetch<LandTitleEvent[]>(`/owner/land/${encodeURIComponent(propertyId)}/title-history`)
    ),

  /** Returns the whole chain, oldest first, with the new owner entry unverified. */
  addTitleEvent: (propertyId: string, input: LandTitleEventInput) =>
    safeCall(() =>
      authFetch<LandTitleEvent[]>(
        `/owner/land/${encodeURIComponent(propertyId)}/title-history`,
        json('POST', input)
      )
    ),
};
