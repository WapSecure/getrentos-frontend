import { authFetch, safeCall, toQuery } from '@sureground/shared';
import type { ApiResponse } from '@sureground/shared';
import type {
  Paginated,
  TierGrant,
  TierGrantState,
  TrustAppeal,
  TrustAppealDecision,
  TrustReviewCaseDetail,
  TrustReviewCaseSummary,
  TrustReviewDecision,
} from '@/types/trust';

// Four-eyes: every final resolution needs a second officer, and nobody resolves a case about their own account (enforced server-side).
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
    input: {
      decision: TrustReviewDecision;
      reasonCodes?: string[];
      note?: string;
      confirmedEvidence?: string[];
      failedEvidence?: string[];
    }
  ): Promise<ApiResponse<TrustReviewCaseSummary & { decision: string }>> {
    return safeCall(() =>
      authFetch(`/admin/trust/review-cases/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          decision: input.decision,
          reasonCodes: input.reasonCodes ?? [],
          note: input.note ?? '',
          confirmedEvidence: input.confirmedEvidence ?? [],
          failedEvidence: input.failedEvidence ?? [],
        }),
      })
    );
  },

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

  // The resolver must not be the original decision-maker (enforced server-side).
  async listAppeals(): Promise<ApiResponse<TrustAppeal[]>> {
    return safeCall(() => authFetch<TrustAppeal[]>('/admin/trust/appeals'));
  },

  async resolveAppeal(
    id: string,
    input: { decision: TrustAppealDecision; resolution?: string }
  ): Promise<ApiResponse<TrustAppeal>> {
    return safeCall(() =>
      authFetch<TrustAppeal>(`/admin/trust/appeals/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          decision: input.decision,
          ...(input.resolution ? { resolution: input.resolution } : {}),
        }),
      })
    );
  },
};
