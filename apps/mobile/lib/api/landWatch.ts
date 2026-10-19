import type {
  InspectorJob,
  LandBoundaryCondition,
  LandWatchDetail,
  LandWatchIncidentKind,
  LandWatchSummary,
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

/** Land Watch for owners and buyers, and the inspector's field desk. */
export const landWatchApi = {
  mine: () => apiFetch<LandWatchSummary[]>('/land/watch'),
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
