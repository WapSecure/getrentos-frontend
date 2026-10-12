import { authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';
import type {
  DecideLandReviewCheckInput,
  LandReviewCase,
  MyLandReviewSummary,
} from '@/types/landReviewer';

/** The outside professional's own land review seats. */
export const landReviewerService = {
  listMine: (page = 1, pageSize = 20) =>
    safeCall(() =>
      authFetch<Paginated<MyLandReviewSummary>>(`/land/reviews${toQuery({ page, pageSize })}`)
    ),

  getSeat: (seatId: string) =>
    safeCall(() => authFetch<LandReviewCase>(`/land/reviews/${encodeURIComponent(seatId)}`)),

  decideCheck: (seatId: string, key: string, input: DecideLandReviewCheckInput) =>
    safeCall(() =>
      authFetch<LandReviewCase>(
        `/land/reviews/${encodeURIComponent(seatId)}/checks/${encodeURIComponent(key)}`,
        {
          method: 'POST',
          body: JSON.stringify({
            status: input.status,
            ...(input.note?.trim() ? { note: input.note.trim() } : {}),
            ...(input.expectedVersion !== undefined
              ? { expectedVersion: input.expectedVersion }
              : {}),
          }),
        }
      )
    ),

  submitReport: (seatId: string, report: string) =>
    safeCall(() =>
      authFetch<LandReviewCase>(`/land/reviews/${encodeURIComponent(seatId)}/report`, {
        method: 'POST',
        body: JSON.stringify({ report: report.trim() }),
      })
    ),
};
