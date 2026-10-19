import { authFetch, safeCall } from '@getrentos/shared';
import type {
  ApiResponse,
  LandInspectionStatus,
  LandWatchSummary,
  StaffInspection,
  StaffLandWatchIncident,
} from '@getrentos/shared';

const insp = (id: string) => `/admin/land/watch/inspections/${encodeURIComponent(id)}`;
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
};
