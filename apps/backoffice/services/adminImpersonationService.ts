import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

export type ReportStatus = 'OPEN' | 'REVIEWED' | 'CLOSED';

export interface ImpersonationReport {
  id: string;
  status: ReportStatus;
  channel: string;
  contactValue: string | null;
  claimedToBe: string;
  description: string;
  amountAsked: number | null;
  paid: boolean;
  propertyTitle: string | null;
  reporterName: string;
  reporterContact: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export const adminImpersonationService = {
  list(status?: ReportStatus): Promise<ApiResponse<ImpersonationReport[]>> {
    return safeCall(() =>
      authFetch<ImpersonationReport[]>(
        `/admin/impersonation-reports${status ? `?status=${status}` : ''}`
      )
    );
  },
  review(id: string, status: 'REVIEWED' | 'CLOSED', note: string) {
    return safeCall(() =>
      authFetch<{ id: string; status: ReportStatus }>(`/admin/impersonation-reports/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ status, note }),
      })
    );
  },
};
