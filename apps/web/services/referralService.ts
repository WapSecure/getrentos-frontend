import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { ReferralSummary } from '@/types/referral';

export const referralService = {
  async getSummary(): Promise<ApiResponse<ReferralSummary>> {
    return safeCall(() => authFetch('/referrals/summary'));
  },
};
