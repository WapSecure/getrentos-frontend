import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

export type AgencyStatus =
  | 'PENDING_KYB'
  | 'ACTIVE'
  | 'RESTRICTED'
  | 'SUSPENDED'
  | 'OFFBOARDING'
  | 'CLOSED';
export type AgencyKybStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface AdminAgency {
  organizationId: string;
  name: string;
  status: AgencyStatus;
  ownerName: string;
  ownerEmail: string | null;
  createdAt: string;
  teamSize: number;
  activeEngagements: number;
  profile: {
    registeredName: string;
    businessType: 'BUSINESS_NAME' | 'LIMITED_COMPANY' | 'INCORPORATED_TRUSTEES';
    registrationNumber: string;
    registeredAddress: string;
    state: string;
    contactEmail: string;
    contactPhone: string;
    certificateFileName: string | null;
    kybStatus: AgencyKybStatus;
    kybSubmittedAt: string | null;
    kybDecidedAt: string | null;
    kybDecisionNote: string | null;
    /** CAC legal name the automated lookup confirmed at submission, if any. */
    verifiedLegalName: string | null;
    cacVerifiedAt: string | null;
  } | null;
}

export const adminAgencyService = {
  list(filter: 'SUBMITTED' | 'PENDING' | 'ALL'): Promise<ApiResponse<AdminAgency[]>> {
    return safeCall(() => authFetch<AdminAgency[]>(`/admin/agencies?filter=${filter}`));
  },
  certificate(id: string): Promise<ApiResponse<{ url: string; fileName: string | null }>> {
    return safeCall(() =>
      authFetch<{ url: string; fileName: string | null }>(`/admin/agencies/${id}/certificate`)
    );
  },
  decide(
    id: string,
    decision: 'APPROVE' | 'REJECT',
    note?: string
  ): Promise<ApiResponse<AdminAgency>> {
    return safeCall(() =>
      authFetch<AdminAgency>(`/admin/agencies/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, note }),
      })
    );
  },
  setStatus(
    id: string,
    status: 'SUSPENDED' | 'ACTIVE',
    reason: string
  ): Promise<ApiResponse<unknown>> {
    return safeCall(() =>
      authFetch(`/admin/agencies/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, reason }),
      })
    );
  },
};
