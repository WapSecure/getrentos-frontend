import { authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type { Paginated } from '@/services/adminService';
import type {
  AdminLandDiligenceDetail,
  DischargeLandEncumbranceInput,
  InviteLandReviewerInput,
  LandConflict,
  LandDiligenceCheckInput,
  LandDiligenceDecisionInput,
  LandDiligenceDocumentLinkInput,
  LandDiligenceRecord,
  LandDiligenceReviewSummary,
  LandDiligenceStatus,
  LandEncumbrance,
  LandReviewerSeat,
  LandRiskAssessment,
  LandTitleEvent,
  RecordLandEncumbranceInput,
  RecordLandTitleEventInput,
  ResolveLandConflictInput,
} from '@/types/land';

export interface ListLandDiligenceParams {
  search?: string;
  status?: LandDiligenceStatus;
  /** `me`: cases assigned to the caller; `unassigned`: unclaimed cases. */
  assigned?: 'me' | 'unassigned';
  /** Only cases in review past their SLA. */
  overdue?: boolean;
  /** `sla`: oldest-owed first (the work-queue order). */
  sort?: 'sla' | 'updated';
  page?: number;
  pageSize?: number;
}

const base = (propertyId: string) => `/admin/land/diligence/${encodeURIComponent(propertyId)}`;

const post = <T>(path: string, body?: unknown): Promise<ApiResponse<T>> =>
  safeCall(() =>
    authFetch<T>(path, {
      method: 'POST',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  );

/**
 * Backoffice-only Land diligence endpoints. The queue carries metadata only;
 * the detail view returns the property's documents with short-lived signed URLs
 * and the state of each document's link to the review.
 *
 * Every decision (approve, reject, clarification, a check) should carry the
 * case `version` the reviewer loaded as `expectedVersion`: the API answers a
 * stale one with 409 so two reviewers acting at once cannot both win.
 */
export const adminLandService = {
  listDiligence(
    params: ListLandDiligenceParams = {}
  ): Promise<ApiResponse<Paginated<LandDiligenceRecord>>> {
    const query = toQuery({
      search: params.search,
      status: params.status,
      assigned: params.assigned,
      overdue: params.overdue ? true : undefined,
      sort: params.sort,
      page: params.page,
      pageSize: params.pageSize,
    });
    return safeCall(() => authFetch(`/admin/land/diligence${query}`));
  },

  /**
   * The case with every document on the property and whether the review cites
   * it. Files come back behind short-lived signed URLs.
   */
  getDiligenceDetail(propertyId: string): Promise<ApiResponse<AdminLandDiligenceDetail>> {
    return safeCall(() => authFetch(base(propertyId)));
  },

  approveDiligence(
    propertyId: string,
    data: Pick<
      LandDiligenceDecisionInput,
      'findings' | 'checklist' | 'expiresAt' | 'expectedVersion'
    > = {}
  ): Promise<ApiResponse<LandDiligenceReviewSummary>> {
    return post(`${base(propertyId)}/approve`, data);
  },

  rejectDiligence(
    propertyId: string,
    data: Pick<LandDiligenceDecisionInput, 'reason' | 'checklist' | 'expectedVersion'>
  ): Promise<ApiResponse<LandDiligenceReviewSummary>> {
    return post(`${base(propertyId)}/reject`, data);
  },

  requestClarification(
    propertyId: string,
    data: Pick<LandDiligenceDecisionInput, 'reason' | 'checklist' | 'expectedVersion'>
  ): Promise<ApiResponse<LandDiligenceReviewSummary>> {
    return post(`${base(propertyId)}/request-clarification`, data);
  },

  /** Assigns the case to a staff member; omitting `assigneeId` claims it for the caller. */
  assignDiligence(
    propertyId: string,
    assigneeId?: string
  ): Promise<ApiResponse<AdminLandDiligenceDetail>> {
    return post(`${base(propertyId)}/assign`, assigneeId ? { assigneeId } : {});
  },

  /**
   * Records one checklist decision. PASSED on a check that requires a document
   * needs one cited against its key first; FLAGGED, or NOT_APPLICABLE on a
   * required check, needs a note.
   */
  recordCheck(
    propertyId: string,
    key: string,
    data: LandDiligenceCheckInput
  ): Promise<ApiResponse<LandDiligenceReviewSummary>> {
    return safeCall(() =>
      authFetch(`${base(propertyId)}/checks/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    );
  },

  /**
   * Records that a check was decided on a particular document. The document must
   * already belong to this property — the API rejects one that does not, so a
   * review cannot be justified by another parcel's paperwork.
   */
  linkDiligenceDocument(
    propertyId: string,
    data: LandDiligenceDocumentLinkInput
  ): Promise<ApiResponse<AdminLandDiligenceDetail>> {
    return post(`${base(propertyId)}/documents`, data);
  },

  /**
   * Stops citing a document. The owner's file is left untouched — only the
   * review's reliance on it is withdrawn.
   */
  unlinkDiligenceDocument(
    propertyId: string,
    documentId: string
  ): Promise<ApiResponse<AdminLandDiligenceDetail>> {
    return safeCall(() =>
      authFetch(`${base(propertyId)}/documents/${encodeURIComponent(documentId)}`, {
        method: 'DELETE',
      })
    );
  },

  // ---- Integrity ----

  listConflicts(propertyId: string): Promise<ApiResponse<LandConflict[]>> {
    return safeCall(() => authFetch(`${base(propertyId)}/conflicts`));
  },

  /** Dismiss or confirm a conflict; the resolution applies to both parcels. */
  resolveConflict(
    propertyId: string,
    conflictId: string,
    data: ResolveLandConflictInput
  ): Promise<ApiResponse<LandConflict[]>> {
    return post(`${base(propertyId)}/conflicts/${encodeURIComponent(conflictId)}/resolve`, data);
  },

  listEncumbrances(propertyId: string): Promise<ApiResponse<LandEncumbrance[]>> {
    return safeCall(() => authFetch(`${base(propertyId)}/encumbrances`));
  },

  recordEncumbrance(
    propertyId: string,
    data: RecordLandEncumbranceInput
  ): Promise<ApiResponse<LandEncumbrance[]>> {
    return post(`${base(propertyId)}/encumbrances`, data);
  },

  dischargeEncumbrance(
    propertyId: string,
    encumbranceId: string,
    data: DischargeLandEncumbranceInput
  ): Promise<ApiResponse<LandEncumbrance[]>> {
    return post(
      `${base(propertyId)}/encumbrances/${encodeURIComponent(encumbranceId)}/discharge`,
      data
    );
  },

  /** The chain of title, oldest first. */
  listTitleHistory(propertyId: string): Promise<ApiResponse<LandTitleEvent[]>> {
    return safeCall(() => authFetch(`${base(propertyId)}/title-history`));
  },

  addTitleEvent(
    propertyId: string,
    data: RecordLandTitleEventInput
  ): Promise<ApiResponse<LandTitleEvent[]>> {
    return post(`${base(propertyId)}/title-history`, data);
  },

  /** Marks an owner-recorded title event as verified. */
  verifyTitleEvent(propertyId: string, eventId: string): Promise<ApiResponse<LandTitleEvent[]>> {
    return post(`${base(propertyId)}/title-history/${encodeURIComponent(eventId)}/verify`);
  },

  // ---- Outside reviewers ----

  listReviewers(propertyId: string): Promise<ApiResponse<LandReviewerSeat[]>> {
    return safeCall(() => authFetch(`${base(propertyId)}/reviewers`));
  },

  inviteReviewer(
    propertyId: string,
    data: InviteLandReviewerInput
  ): Promise<ApiResponse<LandReviewerSeat>> {
    return post(`${base(propertyId)}/reviewers`, data);
  },

  revokeReviewer(
    propertyId: string,
    seatId: string,
    reason?: string
  ): Promise<ApiResponse<LandReviewerSeat>> {
    return post(
      `${base(propertyId)}/reviewers/${encodeURIComponent(seatId)}/revoke`,
      reason?.trim() ? { reason: reason.trim() } : {}
    );
  },

  // ---- Risk ----

  getRisk(propertyId: string): Promise<ApiResponse<LandRiskAssessment>> {
    return safeCall(() => authFetch(`${base(propertyId)}/risk`));
  },

  /** Recomputes and stores the risk score and assurance tier on the case. */
  refreshRisk(propertyId: string): Promise<ApiResponse<LandRiskAssessment>> {
    return post(`${base(propertyId)}/risk/refresh`);
  },
};
