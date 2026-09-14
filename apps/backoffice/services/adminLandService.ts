import { authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type { Paginated } from '@/services/adminService';
import type {
  AdminLandDiligenceDetail,
  LandDiligenceDecisionInput,
  LandDiligenceDocumentLinkInput,
  LandDiligenceRecord,
  LandDiligenceReviewSummary,
  LandDiligenceStatus,
} from '@/types/land';

export interface ListLandDiligenceParams {
  search?: string;
  status?: LandDiligenceStatus;
  page?: number;
  pageSize?: number;
}

/**
 * Backoffice-only Land v1 diligence endpoints. The queue carries metadata only;
 * the detail view returns the property's documents with short-lived signed URLs
 * and the state of each document's link to the review.
 */
export const adminLandService = {
  listDiligence(
    params: ListLandDiligenceParams = {}
  ): Promise<ApiResponse<Paginated<LandDiligenceRecord>>> {
    const query = toQuery({
      search: params.search,
      status: params.status,
      page: params.page,
      pageSize: params.pageSize,
    });
    return safeCall(() => authFetch(`/admin/land/diligence${query}`));
  },

  approveDiligence(
    propertyId: string,
    data: Pick<LandDiligenceDecisionInput, 'findings' | 'checklist' | 'expiresAt'> = {}
  ): Promise<ApiResponse<LandDiligenceReviewSummary>> {
    return safeCall(() =>
      authFetch(`/admin/land/diligence/${propertyId}/approve`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  rejectDiligence(
    propertyId: string,
    data: Pick<LandDiligenceDecisionInput, 'reason' | 'checklist'>
  ): Promise<ApiResponse<LandDiligenceReviewSummary>> {
    return safeCall(() =>
      authFetch(`/admin/land/diligence/${propertyId}/reject`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  requestClarification(
    propertyId: string,
    data: Pick<LandDiligenceDecisionInput, 'reason' | 'checklist'>
  ): Promise<ApiResponse<LandDiligenceReviewSummary>> {
    return safeCall(() =>
      authFetch(`/admin/land/diligence/${propertyId}/request-clarification`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  /**
   * The case with every document on the property and whether the review cites
   * it. Files come back behind short-lived signed URLs.
   */
  getDiligenceDetail(propertyId: string): Promise<ApiResponse<AdminLandDiligenceDetail>> {
    return safeCall(() => authFetch(`/admin/land/diligence/${propertyId}`));
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
    return safeCall(() =>
      authFetch(`/admin/land/diligence/${propertyId}/documents`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
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
      authFetch(`/admin/land/diligence/${propertyId}/documents/${documentId}`, {
        method: 'DELETE',
      })
    );
  },
};
