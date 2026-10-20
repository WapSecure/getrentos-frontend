import { authFetch, safeCall } from '@getrentos/shared';
import type {
  ApiResponse,
  LandInspectionStatus,
  LandWatchJobStatus,
  LandWatchSummary,
  StaffLandWatchJob,
  StaffInspection,
  StaffLandWatchIncident,
} from '@getrentos/shared';

const insp = (id: string) => `/admin/land/watch/inspections/${encodeURIComponent(id)}`;
const job = (id: string) => `/admin/land/watch/jobs/${encodeURIComponent(id)}`;
const post = <T>(path: string, body?: object): Promise<ApiResponse<T>> =>
  safeCall(() => authFetch<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }));

/**
 * Land Watch for staff. Reading, assigning and querying need
 * `verifications.review`; accepting, cancelling and incident decisions need
 * `verifications.approve`.
 */
export const adminLandWatchService = {
  inspections: (status?: LandInspectionStatus) =>
    safeCall(() =>
      authFetch<StaffInspection[]>(
        `/admin/land/watch/inspections${status ? `?status=${encodeURIComponent(status)}` : ''}`
      )
    ),
  inspection: (id: string) => safeCall(() => authFetch<StaffInspection>(insp(id))),
  assign: (id: string, inspectorId: string, dueBy?: string) =>
    post<StaffInspection>(`${insp(id)}/assign`, { inspectorId, ...(dueBy ? { dueBy } : {}) }),
  accept: (id: string, note?: string) =>
    post<StaffInspection>(`${insp(id)}/accept`, note?.trim() ? { note: note.trim() } : {}),
  query: (id: string, note: string) => post<StaffInspection>(`${insp(id)}/query`, { note }),
  cancel: (id: string, note: string) => post<StaffInspection>(`${insp(id)}/cancel`, { note }),
  incidents: () =>
    safeCall(() => authFetch<StaffLandWatchIncident[]>('/admin/land/watch/incidents')),
  resolveIncident: (id: string, outcome: 'CONFIRMED' | 'DISMISSED', note: string) =>
    post(`/admin/land/watch/incidents/${encodeURIComponent(id)}/resolve`, { outcome, note }),
  escalateIncident: (id: string) =>
    post(`/admin/land/watch/incidents/${encodeURIComponent(id)}/escalate`),
  subscriptions: () =>
    safeCall(() => authFetch<LandWatchSummary[]>('/admin/land/watch/subscriptions')),

  /** Vendor jobs: without a status, the open ones, oldest first. */
  jobs: (status?: LandWatchJobStatus) =>
    safeCall(() =>
      authFetch<StaffLandWatchJob[]>(
        `/admin/land/watch/jobs${status ? `?status=${encodeURIComponent(status)}` : ''}`
      )
    ),
  job: (id: string) => safeCall(() => authFetch<StaffLandWatchJob>(job(id))),
  addQuote: (
    id: string,
    input: {
      vendorName: string;
      vendorPhone?: string;
      amountNaira: number;
      scope: string;
      validUntil?: string;
    }
  ) => post<StaffLandWatchJob>(`${job(id)}/quotes`, input),
  withdrawQuote: (id: string, quoteId: string) =>
    post<StaffLandWatchJob>(`${job(id)}/quotes/${encodeURIComponent(quoteId)}/withdraw`),
  startJob: (id: string) => post<StaffLandWatchJob>(`${job(id)}/start`),
  /** Multipart: the browser sets the boundary, so no Content-Type. */
  addJobProof: (id: string, file: File, note?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (note?.trim()) form.append('note', note.trim());
    return safeCall(() =>
      authFetch<StaffLandWatchJob>(`${job(id)}/proof`, { method: 'POST', body: form })
    );
  },
  completeJob: (id: string, note: string) =>
    post<StaffLandWatchJob>(`${job(id)}/complete`, { note }),
  cancelJob: (id: string, reason: string) =>
    post<StaffLandWatchJob>(`${job(id)}/cancel`, { reason }),
};
