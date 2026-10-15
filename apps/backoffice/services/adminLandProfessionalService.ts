import { authFetch, safeCall, toQuery } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type {
  AdminLandProfessional,
  AdminLandProfessionalRow,
  LandProfessionalRole,
  LandProfessionalStatus,
  LandReviewAuditOutcome,
  PendingReviewAudit,
} from '@/types/landProfessional';

export const landProfessionalKeys = {
  root: ['admin', 'land', 'professionals'] as const,
  list: (status?: string, role?: string) =>
    ['admin', 'land', 'professionals', 'list', status ?? '', role ?? ''] as const,
  detail: (id: string) => ['admin', 'land', 'professionals', 'detail', id] as const,
  audits: ['admin', 'land', 'professionals', 'audits'] as const,
};

const base = (id: string) => `/admin/land/professionals/${encodeURIComponent(id)}`;
const decision = (path: string, note: string): Promise<ApiResponse<AdminLandProfessional>> =>
  safeCall(() =>
    authFetch<AdminLandProfessional>(path, { method: 'POST', body: JSON.stringify({ note }) })
  );

/**
 * Land professionals for staff: reading needs `verifications.review`;
 * decisions and audits need `verifications.approve`.
 */
export const adminLandProfessionalService = {
  list: (params: { status?: LandProfessionalStatus; role?: LandProfessionalRole } = {}) =>
    safeCall(() =>
      authFetch<AdminLandProfessionalRow[]>(`/admin/land/professionals${toQuery(params)}`)
    ),
  detail: (id: string) => safeCall(() => authFetch<AdminLandProfessional>(base(id))),
  accredit: (id: string, note: string) => decision(`${base(id)}/accredit`, note),
  reject: (id: string, note: string) => decision(`${base(id)}/reject`, note),
  suspend: (id: string, note: string) => decision(`${base(id)}/suspend`, note),
  reinstate: (id: string, note: string) => decision(`${base(id)}/reinstate`, note),
  audits: () => safeCall(() => authFetch<PendingReviewAudit[]>('/admin/land/professionals/audits')),
  recordAudit: (seatId: string, outcome: LandReviewAuditOutcome, note: string) =>
    safeCall(() =>
      authFetch<PendingReviewAudit[]>(
        `/admin/land/professionals/audits/${encodeURIComponent(seatId)}`,
        { method: 'POST', body: JSON.stringify({ outcome, note }) }
      )
    ),
};
