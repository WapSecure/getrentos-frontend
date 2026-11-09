import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

/**
 * Resolved by someone other than the original officer; overturning reopens the target for a fresh
 * review.
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

  async listMine(): Promise<ApiResponse<TrustAppealDto[]>> {
    return safeCall(() => authFetch<TrustAppealDto[]>('/trust/appeals/mine'));
  },

  async listForReview(): Promise<ApiResponse<TrustAppealDto[]>> {
    return safeCall(() => authFetch<TrustAppealDto[]>('/admin/trust/appeals'));
  },

  /**
   * The backend enforces that the reviewer is not the original decision-maker. Overturning reopens
   * the target.
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
