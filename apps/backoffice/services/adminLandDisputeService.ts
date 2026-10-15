import { authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type { Paginated } from '@/services/adminService';
import type { AdminLandDispute, LandDisputeOutcome, LandDisputeStatus } from '@/types/landDispute';

export interface ListAdminLandDisputesParams {
  status?: LandDisputeStatus;
  held?: boolean;
  page?: number;
  pageSize?: number;
}

const base = (disputeId: string) => `/admin/land/disputes/${encodeURIComponent(disputeId)}`;
const post = (path: string, body?: object): Promise<ApiResponse<AdminLandDispute>> =>
  safeCall(() =>
    authFetch<AdminLandDispute>(path, {
      method: 'POST',
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  );

/**
 * Land disputes for staff: reading needs `verifications.review`; holds and
 * decisions need `verifications.approve`.
 */
export const adminLandDisputeService = {
  list(
    params: ListAdminLandDisputesParams = {}
  ): Promise<ApiResponse<Paginated<AdminLandDispute>>> {
    return safeCall(() =>
      authFetch(
        `/admin/land/disputes${toQuery({
          status: params.status,
          held: params.held === undefined ? undefined : String(params.held),
          page: params.page,
          pageSize: params.pageSize,
        })}`
      )
    );
  },
  detail: (disputeId: string): Promise<ApiResponse<AdminLandDispute>> =>
    safeCall(() => authFetch(base(disputeId))),
  assignToMe: (disputeId: string) => post(`${base(disputeId)}/assign`, {}),
  addNote: (disputeId: string, note: string, visibleToParties: boolean) =>
    post(`${base(disputeId)}/notes`, { note, visibleToParties }),
  hold: (disputeId: string, reason: string) => post(`${base(disputeId)}/hold`, { reason }),
  liftHold: (disputeId: string, note: string) => post(`${base(disputeId)}/hold/lift`, { note }),
  decide: (disputeId: string, outcome: LandDisputeOutcome, decision: string) =>
    post(`${base(disputeId)}/decide`, { outcome, decision }),
  /** Staff evidence (e.g. a registry search). Multipart: the browser sets the boundary. */
  addEvidence(
    disputeId: string,
    file: File,
    note?: string
  ): Promise<ApiResponse<AdminLandDispute>> {
    const form = new FormData();
    form.append('file', file);
    if (note?.trim()) form.append('note', note.trim());
    return safeCall(() =>
      authFetch<AdminLandDispute>(`${base(disputeId)}/evidence`, { method: 'POST', body: form })
    );
  },
};
