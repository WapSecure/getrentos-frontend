import { authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type {
  Paginated,
  TierGrant,
  TierGrantState,
  TrustReviewCaseDetail,
  TrustReviewCaseSummary,
  TrustReviewDecision,
} from '@/types/trust';

/**
 * Trust review-case queue API (backend /admin/trust/review-cases).
 * Four-eyes note: REJECT/RESTRICT resolutions require a second officer
 * distinct from the assigned reviewer — enforced server-side; the UI surfaces
 * the resulting error message.
 */
export const trustService = {
  async listReviewCases(params: {
    status?: string;
    priority?: string;
    page: number;
    pageSize: number;
  }): Promise<ApiResponse<Paginated<TrustReviewCaseSummary>>> {
    return safeCall(async () => {
      const query = toQuery({
        status: params.status,
        priority: params.priority,
        page: String(params.page),
        pageSize: String(params.pageSize),
      });
      return authFetch<Paginated<TrustReviewCaseSummary>>(`/admin/trust/review-cases${query}`);
    });
  },

  async getReviewCaseDetail(id: string): Promise<ApiResponse<TrustReviewCaseDetail>> {
    return safeCall(() => authFetch<TrustReviewCaseDetail>(`/admin/trust/review-cases/${id}`));
  },

  async assignReviewCase(
    id: string,
    assigneeId: string
  ): Promise<ApiResponse<TrustReviewCaseSummary>> {
    return safeCall(() =>
      authFetch(`/admin/trust/review-cases/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assigneeId }),
      })
    );
  },

  async escalateReviewCase(
    id: string,
    note?: string
  ): Promise<ApiResponse<TrustReviewCaseSummary>> {
    return safeCall(() =>
      authFetch(`/admin/trust/review-cases/${id}/escalate`, {
        method: 'POST',
        body: JSON.stringify({ note: note ?? '' }),
      })
    );
  },

  async resolveReviewCase(
    id: string,
    input: { decision: TrustReviewDecision; reasonCodes?: string[]; note?: string }
  ): Promise<ApiResponse<TrustReviewCaseSummary & { decision: string }>> {
    return safeCall(() =>
      authFetch(`/admin/trust/review-cases/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          decision: input.decision,
          reasonCodes: input.reasonCodes ?? [],
          note: input.note ?? '',
        }),
      })
    );
  },

  /**
   * Manual tier-3 (financial capability) grants. A grant is the backoffice's
   * answer for a host who cannot pass the automated bank name enquiry; it is
   * carried as a real PASS-decided verification, so it can be listed, expired
   * and revoked like any other evidence.
   */
  async listTierGrants(params: {
    userId?: string;
    state?: TierGrantState;
    activeOnly?: boolean;
    page: number;
    pageSize: number;
  }): Promise<ApiResponse<Paginated<TierGrant>>> {
    return safeCall(async () => {
      const query = toQuery({
        userId: params.userId,
        state: params.state,
        activeOnly: params.activeOnly ? 'true' : undefined,
        page: String(params.page),
        pageSize: String(params.pageSize),
      });
      return authFetch<Paginated<TierGrant>>(`/admin/trust/tier-grants${query}`);
    });
  },

  async grantTier3(input: {
    userId: string;
    reason: string;
    expiresInDays?: number;
  }): Promise<ApiResponse<TierGrant>> {
    return safeCall(() =>
      authFetch<TierGrant>('/admin/trust/tier-grants', {
        method: 'POST',
        body: JSON.stringify({
          userId: input.userId,
          reason: input.reason,
          ...(input.expiresInDays ? { expiresInDays: input.expiresInDays } : {}),
        }),
      })
    );
  },

  async revokeTierGrant(userId: string, reason: string): Promise<ApiResponse<TierGrant>> {
    return safeCall(() =>
      authFetch<TierGrant>(`/admin/trust/tier-grants/${userId}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },
};
