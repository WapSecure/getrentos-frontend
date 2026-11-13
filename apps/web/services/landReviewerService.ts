import { authFetch, safeCall, toQuery, type Paginated } from '@/lib/apiHelpers';
import type {
  DecideLandReviewCheckInput,
  LandReviewCase,
  LandReviewCiteInput,
  LandReviewUploadInput,
  LandReviewValuationInput,
  MyLandReviewSummary,
} from '@/types/landReviewer';

const seatPath = (seatId: string) => `/land/reviews/${encodeURIComponent(seatId)}`;

export const landReviewerService = {
  listMine: (page = 1, pageSize = 20) =>
    safeCall(() =>
      authFetch<Paginated<MyLandReviewSummary>>(`/land/reviews${toQuery({ page, pageSize })}`)
    ),

  getSeat: (seatId: string) =>
    safeCall(() => authFetch<LandReviewCase>(`/land/reviews/${encodeURIComponent(seatId)}`)),

  signOffBoundary: (
    seatId: string,
    versionId: string,
    input: { decision: 'SIGNED_OFF' | 'REJECTED'; note?: string }
  ) =>
    safeCall(() =>
      authFetch<LandReviewCase>(
        `${seatPath(seatId)}/boundary/${encodeURIComponent(versionId)}/sign-off`,
        {
          method: 'POST',
          body: JSON.stringify({
            decision: input.decision,
            ...(input.note?.trim() ? { note: input.note.trim() } : {}),
          }),
        }
      )
    ),

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

  /** Required once before any work; DECLARED withdraws the seat. */
  declareConflict: (seatId: string, declaration: 'NONE' | 'DECLARED', note?: string) =>
    safeCall(() =>
      authFetch<LandReviewCase>(`${seatPath(seatId)}/conflict`, {
        method: 'POST',
        body: JSON.stringify({ declaration, ...(note?.trim() ? { note: note.trim() } : {}) }),
      })
    ),

  submitReport: (seatId: string, report: string) =>
    safeCall(() =>
      authFetch<LandReviewCase>(`/land/reviews/${encodeURIComponent(seatId)}/report`, {
        method: 'POST',
        body: JSON.stringify({ report: report.trim() }),
      })
    ),

  /**
   * DIA-30: a valuer seat files the signed report with the value, method and dates. Neutral path: valuations
   * are not land-only.
   */
  submitValuation: (seatId: string, input: LandReviewValuationInput) => {
    const form = new FormData();
    form.append('file', input.file);
    form.append('amount', String(Math.round(input.amount)));
    form.append('method', input.method);
    form.append('inspectedAt', input.inspectedAt);
    form.append('reportDate', input.reportDate);
    return safeCall(() =>
      authFetch<LandReviewCase>(`/professionals/reviews/${encodeURIComponent(seatId)}/valuation`, {
        method: 'POST',
        body: form,
      })
    );
  },

  /** The file lands on the property, cited on `checklistKey` when given. */
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

  /** 403 for anyone else's citation. */
  uncite: (seatId: string, documentId: string, checklistKey: string) =>
    safeCall(() =>
      authFetch<LandReviewCase>(
        `${seatPath(seatId)}/citations/${encodeURIComponent(documentId)}?checklistKey=${encodeURIComponent(checklistKey)}`,
        { method: 'DELETE' }
      )
    ),
};
