import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export const videoCallService = {
  availability: (): Promise<ApiResponse<{ available: boolean }>> =>
    safeCall(() => authFetch<{ available: boolean }>('/video-calls/availability')),
};

/** Shared so the answer is fetched once. */
export const videoCallAvailabilityQuery = {
  queryKey: ['video-calls', 'availability'] as const,
  staleTime: 5 * 60 * 1000,
};
