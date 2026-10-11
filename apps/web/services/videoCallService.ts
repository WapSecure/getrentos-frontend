import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export const videoCallService = {
  /** Whether live video viewings can be booked (the call service is configured). */
  availability: (): Promise<ApiResponse<{ available: boolean }>> =>
    safeCall(() => authFetch<{ available: boolean }>('/video-calls/availability')),
};

/** The query every booking form shares, so the answer is fetched once. */
export const videoCallAvailabilityQuery = {
  queryKey: ['video-calls', 'availability'] as const,
  staleTime: 5 * 60 * 1000,
};
