import { authFetch, safeCall, toQuery } from '@sureground/shared';
import type { ApiResponse, PropertyValuation, ValuationMethod } from '@sureground/shared';
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
  /** DIA-30: a valuer's signed report, recorded by staff on their behalf (neutral route; not land-only). */
  recordValuation: (
    id: string,
    input: {
      propertyId: string;
      amount: number;
      method: ValuationMethod;
      inspectedAt: string;
      reportDate: string;
      file: File;
    }
  ) => {
    const form = new FormData();
    form.append('file', input.file);
    form.append('propertyId', input.propertyId);
    form.append('amount', String(Math.round(input.amount)));
    form.append('method', input.method);
    form.append('inspectedAt', input.inspectedAt);
    form.append('reportDate', input.reportDate);
    return safeCall(() =>
      authFetch<PropertyValuation>(`/admin/professionals/${encodeURIComponent(id)}/valuations`, {
        method: 'POST',
        body: form,
      })
    );
  },
  audits: () => safeCall(() => authFetch<PendingReviewAudit[]>('/admin/land/professionals/audits')),
  recordAudit: (seatId: string, outcome: LandReviewAuditOutcome, note: string) =>
    safeCall(() =>
      authFetch<PendingReviewAudit[]>(
        `/admin/land/professionals/audits/${encodeURIComponent(seatId)}`,
        { method: 'POST', body: JSON.stringify({ outcome, note }) }
      )
    ),
};
