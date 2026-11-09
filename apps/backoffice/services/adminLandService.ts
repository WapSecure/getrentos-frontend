import { authFetch, safeCall, toQuery } from '@sureground/shared';
import type { ApiResponse, LandBoundaryVersion } from '@sureground/shared';
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
  LandDocumentUploadInput,
  LandUploadedDocument,
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
  assigned?: 'me' | 'unassigned';
  overdue?: boolean;
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

// Send the loaded case version as expectedVersion on every decision: a stale one gets 409, so two reviewers acting at once cannot both win.
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

  listBoundaryVersions(propertyId: string): Promise<ApiResponse<LandBoundaryVersion[]>> {
    return safeCall(() => authFetch(`${base(propertyId)}/boundary/versions`));
  },

  getDiligenceDetail(propertyId: string): Promise<ApiResponse<AdminLandDiligenceDetail>> {
    return safeCall(() => authFetch(base(propertyId)));
  },

  approveDiligence(
    propertyId: string,
    data: Pick<
      LandDiligenceDecisionInput,
      'findings' | 'checklist' | 'expiresAt' | 'expectedVersion' | 'conditions'
    > = {}
  ): Promise<ApiResponse<LandDiligenceReviewSummary>> {
    return post(`${base(propertyId)}/approve`, data);
  },

  // The last condition settled turns the case VERIFIED.
  settleCondition(
    propertyId: string,
    conditionId: string,
    outcome: 'meet' | 'waive',
    data: { note: string; expectedVersion?: number }
  ): Promise<ApiResponse<LandDiligenceReviewSummary>> {
    return post(`${base(propertyId)}/conditions/${encodeURIComponent(conditionId)}/${outcome}`, {
      ...data,
      note: data.note.trim(),
    });
  },

  suspendDiligence(
    propertyId: string,
    data: { reason: string; expectedVersion?: number }
  ): Promise<ApiResponse<LandDiligenceReviewSummary>> {
    return post(`${base(propertyId)}/suspend`, { ...data, reason: data.reason.trim() });
  },

  // Refused while a hold, encumbrance or conflict remains.
  resumeDiligence(
    propertyId: string,
    data: { note: string; expectedVersion?: number }
  ): Promise<ApiResponse<LandDiligenceReviewSummary>> {
    return post(`${base(propertyId)}/resume`, { ...data, note: data.note.trim() });
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

  // Omitting assigneeId claims it for the caller.
  assignDiligence(
    propertyId: string,
    assigneeId?: string
  ): Promise<ApiResponse<AdminLandDiligenceDetail>> {
    return post(`${base(propertyId)}/assign`, assigneeId ? { assigneeId } : {});
  },

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

  // The API rejects a document from another property.
  linkDiligenceDocument(
    propertyId: string,
    data: LandDiligenceDocumentLinkInput
  ): Promise<ApiResponse<AdminLandDiligenceDetail>> {
    return post(`${base(propertyId)}/documents`, data);
  },

  // Leaves the owner's file untouched. A null checklistKey is a citation tied to no check; omit it to remove the document's only citation.
  unlinkDiligenceDocument(
    propertyId: string,
    documentId: string,
    checklistKey?: string | null
  ): Promise<ApiResponse<AdminLandDiligenceDetail>> {
    const query =
      checklistKey === undefined ? '' : `?checklistKey=${encodeURIComponent(checklistKey ?? '')}`;
    return safeCall(() =>
      authFetch(`${base(propertyId)}/documents/${encodeURIComponent(documentId)}${query}`, {
        method: 'DELETE',
      })
    );
  },

  // Multipart: the browser sets the boundary, so no Content-Type.
  uploadDocument(
    propertyId: string,
    input: LandDocumentUploadInput
  ): Promise<ApiResponse<LandUploadedDocument>> {
    const form = new FormData();
    form.append('file', input.file);
    form.append('documentType', input.documentType);
    return safeCall(() =>
      authFetch<LandUploadedDocument>(`${base(propertyId)}/documents/upload`, {
        method: 'POST',
        body: form,
      })
    );
  },

  listConflicts(propertyId: string): Promise<ApiResponse<LandConflict[]>> {
    return safeCall(() => authFetch(`${base(propertyId)}/conflicts`));
  },

  // The resolution applies to both parcels.
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

  listTitleHistory(propertyId: string): Promise<ApiResponse<LandTitleEvent[]>> {
    return safeCall(() => authFetch(`${base(propertyId)}/title-history`));
  },

  addTitleEvent(
    propertyId: string,
    data: RecordLandTitleEventInput
  ): Promise<ApiResponse<LandTitleEvent[]>> {
    return post(`${base(propertyId)}/title-history`, data);
  },

  verifyTitleEvent(propertyId: string, eventId: string): Promise<ApiResponse<LandTitleEvent[]>> {
    return post(`${base(propertyId)}/title-history/${encodeURIComponent(eventId)}/verify`);
  },

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

  getRisk(propertyId: string): Promise<ApiResponse<LandRiskAssessment>> {
    return safeCall(() => authFetch(`${base(propertyId)}/risk`));
  },

  refreshRisk(propertyId: string): Promise<ApiResponse<LandRiskAssessment>> {
    return post(`${base(propertyId)}/risk/refresh`);
  },
};
