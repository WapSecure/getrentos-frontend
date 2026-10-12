import { authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';
import type {
  DecideLandReviewCheckInput,
  LandReviewCase,
  LandReviewCiteInput,
  LandReviewUploadInput,
  MyLandReviewSummary,
} from '@/types/landReviewer';

const seatPath = (seatId: string) => `/land/reviews/${encodeURIComponent(seatId)}`;

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

  /** Multipart: the file lands on the property, cited on `checklistKey` when given. */
  uploadDocument: (seatId: string, input: LandReviewUploadInput) => {
    const form = new FormData();
    form.append('file', input.file);
    form.append('documentType', input.documentType);
    if (input.checklistKey) form.append('checklistKey', input.checklistKey);
    if (input.note?.trim()) form.append('note', input.note.trim());
    return safeCall(() =>
      authFetch<LandReviewCase>(`${seatPath(seatId)}/documents`, { method: 'POST', body: form })
    );
  },

  /** Cites a document already on the property against one of the seat's checks. */
  citeDocument: (seatId: string, input: LandReviewCiteInput) =>
    safeCall(() =>
      authFetch<LandReviewCase>(`${seatPath(seatId)}/citations`, {
        method: 'POST',
        body: JSON.stringify({
          documentId: input.documentId,
          checklistKey: input.checklistKey,
          ...(input.note?.trim() ? { note: input.note.trim() } : {}),
        }),
      })
    ),

  /** Withdraws one of the reviewer's own citations (403 for anyone else's). */
  uncite: (seatId: string, documentId: string) =>
    safeCall(() =>
      authFetch<LandReviewCase>(`${seatPath(seatId)}/citations/${encodeURIComponent(documentId)}`, {
        method: 'DELETE',
      })
    ),
};
