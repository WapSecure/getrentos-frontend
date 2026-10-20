import { authFetch, safeCall } from '@/lib/apiHelpers';
import type {
  InspectorJob,
  LandBoundaryCondition,
  LandWatchDetail,
  LandWatchIncidentKind,
  LandWatchJob,
  LandWatchJobKind,
  LandWatchOption,
  LandWatchReminderKind,
  LandWatchSummary,
  LandWatchTerms,
  LandWatchTier,
} from '@getrentos/shared';

const send = <T>(path: string, method: string, body?: unknown) =>
  safeCall(() =>
    authFetch<T>(path, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
  );
const watchPath = (id: string) => `/land/watch/${encodeURIComponent(id)}`;
const jobPath = (id: string) => `/land/inspections/${encodeURIComponent(id)}`;

export interface CaptureMeta {
  capturedAt: string;
  lat?: number;
  lng?: number;
  capturedOffline?: boolean;
  clientRef?: string;
  note?: string;
}

/** Land Watch for owners and buyers, and the inspector's desk. */
export const landWatchService = {
  terms: () => safeCall(() => authFetch<LandWatchTerms>('/land/watch/terms')),
  options: () => safeCall(() => authFetch<LandWatchOption[]>('/land/watch/options')),
  mine: () => safeCall(() => authFetch<LandWatchSummary[]>('/land/watch')),
  get: (id: string) => safeCall(() => authFetch<LandWatchDetail>(watchPath(id))),
  subscribe: (input: { propertyId?: string; landPlotId?: string; tier: LandWatchTier }) =>
    send<LandWatchDetail>('/land/watch', 'POST', { ...input, acceptDisclaimer: true }),
  update: (id: string, input: { tier?: LandWatchTier; status?: 'ACTIVE' | 'PAUSED' }) =>
    send<LandWatchDetail>(watchPath(id), 'PATCH', input),
  cancel: (id: string) => send<{ cancelled: boolean }>(`${watchPath(id)}/cancel`, 'POST'),
  reportIncident: (
    id: string,
    input: { kind: LandWatchIncidentKind; description: string; requestInspection?: boolean }
  ) => send<LandWatchDetail>(`${watchPath(id)}/incidents`, 'POST', input),
  reinspect: (inspectionId: string, reason: string) =>
    send<LandWatchDetail>(
      `/land/watch/inspections/${encodeURIComponent(inspectionId)}/reinspect`,
      'POST',
      { reason }
    ),
  addReminder: (
    id: string,
    input: {
      kind: LandWatchReminderKind;
      label: string;
      dueDate: string;
      annual?: boolean;
      amountNaira?: number;
    }
  ) => send<LandWatchDetail>(`${watchPath(id)}/reminders`, 'POST', input),
  reminderPaid: (id: string, reminderId: string) =>
    send<LandWatchDetail>(
      `${watchPath(id)}/reminders/${encodeURIComponent(reminderId)}/paid`,
      'POST'
    ),
  removeReminder: (id: string, reminderId: string) =>
    send<LandWatchDetail>(`${watchPath(id)}/reminders/${encodeURIComponent(reminderId)}`, 'DELETE'),

  jobs: (id: string) => safeCall(() => authFetch<LandWatchJob[]>(`${watchPath(id)}/jobs`)),
  requestJob: (id: string, input: { kind: LandWatchJobKind; description: string }) =>
    send<LandWatchJob>(`${watchPath(id)}/jobs`, 'POST', input),
  acceptQuote: (id: string, jobId: string, quoteId: string) =>
    send<LandWatchJob>(
      `${watchPath(id)}/jobs/${encodeURIComponent(jobId)}/quotes/${encodeURIComponent(quoteId)}/accept`,
      'POST'
    ),
  declineQuote: (id: string, jobId: string, quoteId: string) =>
    send<LandWatchJob>(
      `${watchPath(id)}/jobs/${encodeURIComponent(jobId)}/quotes/${encodeURIComponent(quoteId)}/decline`,
      'POST'
    ),
  cancelJob: (id: string, jobId: string, reason: string) =>
    send<LandWatchJob>(`${watchPath(id)}/jobs/${encodeURIComponent(jobId)}/cancel`, 'POST', {
      reason,
    }),
  requestJobCheck: (id: string, jobId: string) =>
    send<LandWatchJob>(`${watchPath(id)}/jobs/${encodeURIComponent(jobId)}/check`, 'POST'),

  myJobs: () => safeCall(() => authFetch<InspectorJob[]>('/land/inspections')),
  job: (id: string) => safeCall(() => authFetch<InspectorJob>(jobPath(id))),
  /** One capture; multipart, so the browser sets the boundary. */
  addEvidence(id: string, file: File, meta: CaptureMeta) {
    const form = new FormData();
    form.append('file', file);
    for (const [key, value] of Object.entries(meta)) {
      if (value !== undefined && value !== null && value !== '') form.append(key, String(value));
    }
    return safeCall(() =>
      authFetch<{ evidenceId: string; duplicate: boolean }>(`${jobPath(id)}/evidence`, {
        method: 'POST',
        body: form,
      })
    );
  },
  submit: (
    id: string,
    input: {
      boundaryCondition: LandBoundaryCondition;
      beaconsExpected?: number;
      beaconsFound?: number;
      summary: string;
      lat?: number;
      lng?: number;
    }
  ) => send<InspectorJob>(`${jobPath(id)}/submit`, 'POST', input),
};

/** The browser's position, or null when refused, unavailable or slow. */
export const currentPosition = (): Promise<{ lat: number; lng: number } | null> =>
  new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 }
    );
  });
