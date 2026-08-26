import { authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type { Paginated } from '@/services/adminService';
import type {
  LandDiligenceDecisionInput,
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
 * Backoffice-only Land v1 diligence endpoints. Deliberately no document
 * download helper lives here: evidence remains behind the secured Documents
 * workspace and is never exposed as a raw storage URL in a review queue.
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
};
