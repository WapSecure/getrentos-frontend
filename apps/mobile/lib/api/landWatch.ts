import type {
  InspectorJob,
  LandBoundaryCondition,
  LandWatchDetail,
  LandWatchIncidentKind,
  LandWatchJob,
  LandWatchJobKind,
  LandWatchOption,
  LandWatchSummary,
  LandWatchTerms,
  LandWatchTier,
} from '@getrentos/shared';
import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';

export interface CaptureFields {
  capturedAt: string;
  lat?: number;
  lng?: number;
  capturedOffline?: boolean;
  clientRef?: string;
  note?: string;
}

const jobPath = (watchId: string, jobId: string) =>
  `/land/watch/${encodeURIComponent(watchId)}/jobs/${encodeURIComponent(jobId)}`;

/** Land Watch for owners and buyers, and the inspector's field desk. */
export const landWatchApi = {
  mine: () => apiFetch<LandWatchSummary[]>('/land/watch'),
  terms: () => apiFetch<LandWatchTerms>('/land/watch/terms'),
  options: () => apiFetch<LandWatchOption[]>('/land/watch/options'),
  /** The owner has read the disclaimer on screen before this is called. */
  subscribe: (body: { propertyId?: string; landPlotId?: string; tier: LandWatchTier }) =>
    apiFetch<LandWatchDetail>('/land/watch', {
      method: 'POST',
      body: { ...body, acceptDisclaimer: true },
    }),
  get: (id: string) => apiFetch<LandWatchDetail>(`/land/watch/${encodeURIComponent(id)}`),
  reportIncident: (
    id: string,
    body: { kind: LandWatchIncidentKind; description: string; requestInspection?: boolean }
  ) =>
    apiFetch<LandWatchDetail>(`/land/watch/${encodeURIComponent(id)}/incidents`, {
      method: 'POST',
      body,
    }),
  reminderPaid: (id: string, reminderId: string) =>
    apiFetch<LandWatchDetail>(
      `/land/watch/${encodeURIComponent(id)}/reminders/${encodeURIComponent(reminderId)}/paid`,
      { method: 'POST', body: {} }
    ),

  /** Vendor work on a Managed watch. None of these are optimistic: each is a commitment. */
  watchJobs: (watchId: string) =>
    apiFetch<LandWatchJob[]>(`/land/watch/${encodeURIComponent(watchId)}/jobs`),
  requestJob: (watchId: string, body: { kind: LandWatchJobKind; description: string }) =>
    apiFetch<LandWatchJob>(`/land/watch/${encodeURIComponent(watchId)}/jobs`, {
      method: 'POST',
      body,
    }),
  acceptQuote: (watchId: string, jobId: string, quoteId: string) =>
    apiFetch<LandWatchJob>(
      `${jobPath(watchId, jobId)}/quotes/${encodeURIComponent(quoteId)}/accept`,
      { method: 'POST', body: {} }
    ),
  declineQuote: (watchId: string, jobId: string, quoteId: string) =>
    apiFetch<LandWatchJob>(
      `${jobPath(watchId, jobId)}/quotes/${encodeURIComponent(quoteId)}/decline`,
      { method: 'POST', body: {} }
    ),
  cancelJob: (watchId: string, jobId: string, reason: string) =>
    apiFetch<LandWatchJob>(`${jobPath(watchId, jobId)}/cancel`, {
      method: 'POST',
      body: { reason },
    }),
  /** Books an independent inspection of the finished work (once, when COMPLETED). */
  requestJobCheck: (watchId: string, jobId: string) =>
    apiFetch<LandWatchJob>(`${jobPath(watchId, jobId)}/check`, { method: 'POST', body: {} }),

  jobs: () => apiFetch<InspectorJob[]>('/land/inspections'),
  job: (id: string) => apiFetch<InspectorJob>(`/land/inspections/${encodeURIComponent(id)}`),
  /** One capture. The server keeps one copy per file or client reference, so a retry is safe. */
  uploadEvidence: (id: string, file: PickedFile, fields: CaptureFields) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== null && value !== '') form.append(key, String(value));
    }
    return apiUpload<{ evidenceId: string; duplicate: boolean }>(
      `/land/inspections/${encodeURIComponent(id)}/evidence`,
      form
    );
  },
  submit: (
    id: string,
    body: {
      boundaryCondition: LandBoundaryCondition;
      beaconsExpected?: number;
      beaconsFound?: number;
      summary: string;
      lat?: number;
      lng?: number;
    }
  ) =>
    apiFetch<InspectorJob>(`/land/inspections/${encodeURIComponent(id)}/submit`, {
      method: 'POST',
      body,
    }),
};
