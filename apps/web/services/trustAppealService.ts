import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

/**
 * Trust appeals (TG-06) — contesting a rejected trust decision.
 *
 * The subject of a rejected property-authority claim or a failed/rejected
 * verification can appeal it. The appeal is resolved by someone *other* than the
 * officer who made the original decision; overturning it reopens the target for a
 * fresh review. This service covers both halves: the subject's side (`file`,
 * `listMine`) and the reviewer's side (`listForReview`, `resolve`).
 */

/** Decision types a subject can appeal — mirrors backend APPEAL_TARGET_TYPES. */
export const APPEAL_TARGET_TYPES = ['PROPERTY_AUTHORITY', 'TRUST_VERIFICATION'] as const;
export type AppealTargetType = (typeof APPEAL_TARGET_TYPES)[number];

export const APPEAL_TARGET_LABELS: Record<AppealTargetType, string> = {
  PROPERTY_AUTHORITY: 'Property authority claim',
  TRUST_VERIFICATION: 'Identity / trust verification',
};

export type TrustAppealStatus = 'OPEN' | 'UNDER_REVIEW' | 'UPHELD' | 'OVERTURNED' | 'CLOSED';

export interface TrustAppealDto {
  id: string;
  subjectUserId: string;
  targetType: AppealTargetType;
  targetId: string;
  originalDeciderId?: string | null;
  reason: string;
  status: TrustAppealStatus;
  reviewerId?: string | null;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

export type AppealDecision = 'UPHELD' | 'OVERTURNED';

export const trustAppealService = {
  /** Subject: appeal a rejected decision about you. */
  async file(input: {
    targetType: AppealTargetType;
    targetId: string;
    reason: string;
  }): Promise<ApiResponse<TrustAppealDto>> {
    return safeCall(() =>
      authFetch<TrustAppealDto>('/trust/appeals', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  /** Subject: appeals you have filed, newest first. */
  async listMine(): Promise<ApiResponse<TrustAppealDto[]>> {
    return safeCall(() => authFetch<TrustAppealDto[]>('/trust/appeals/mine'));
  },

  /** Reviewer: the appeal queue (open + under review), oldest first. */
  async listForReview(): Promise<ApiResponse<TrustAppealDto[]>> {
    return safeCall(() => authFetch<TrustAppealDto[]>('/admin/trust/appeals'));
  },

  /**
   * Reviewer: uphold or overturn an appeal. The reviewer must not be the original
   * decision-maker (the backend enforces this). Overturning reopens the target.
   */
  async resolve(
    id: string,
    input: { decision: AppealDecision; resolution?: string }
  ): Promise<ApiResponse<TrustAppealDto>> {
    return safeCall(() =>
      authFetch<TrustAppealDto>(`/admin/trust/appeals/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },
};
