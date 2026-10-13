import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export type AgencyStatus =
  | 'PENDING_KYB'
  | 'ACTIVE'
  | 'RESTRICTED'
  | 'SUSPENDED'
  | 'OFFBOARDING'
  | 'CLOSED';
export type AgencyBusinessType = 'BUSINESS_NAME' | 'LIMITED_COMPANY' | 'INCORPORATED_TRUSTEES';
export type AgencyKybStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface AgencyProfileInput {
  name: string;
  registeredName: string;
  businessType: AgencyBusinessType;
  registrationNumber: string;
  registeredAddress: string;
  state: string;
  contactEmail: string;
  contactPhone: string;
}

export interface AgencyOnboarding {
  organizationId: string;
  name: string;
  status: AgencyStatus;
  isOwner: boolean;
  profile:
    | (Omit<AgencyProfileInput, 'name'> & {
        certificateFileName: string | null;
        kybStatus: AgencyKybStatus;
        kybSubmittedAt: string | null;
        kybDecidedAt: string | null;
        kybDecisionNote: string | null;
      })
    | null;
}

export const BUSINESS_TYPE_LABELS: Record<AgencyBusinessType, string> = {
  BUSINESS_NAME: 'Business name (BN)',
  LIMITED_COMPANY: 'Limited company (RC)',
  INCORPORATED_TRUSTEES: 'Incorporated trustees (IT)',
};

export const agencyOnboardingService = {
  mine(): Promise<ApiResponse<AgencyOnboarding>> {
    return safeCall(() => authFetch<AgencyOnboarding>('/agency/onboarding'));
  },
  create(input: AgencyProfileInput): Promise<ApiResponse<AgencyOnboarding>> {
    return safeCall(() =>
      authFetch<AgencyOnboarding>('/agency/onboarding', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },
  update(input: AgencyProfileInput): Promise<ApiResponse<AgencyOnboarding>> {
    return safeCall(() =>
      authFetch<AgencyOnboarding>('/agency/onboarding', {
        method: 'PUT',
        body: JSON.stringify(input),
      })
    );
  },
  uploadCertificate(file: File): Promise<ApiResponse<AgencyOnboarding>> {
    const form = new FormData();
    form.append('file', file);
    return safeCall(() =>
      authFetch<AgencyOnboarding>('/agency/onboarding/certificate', { method: 'POST', body: form })
    );
  },
  submit(): Promise<ApiResponse<AgencyOnboarding>> {
    return safeCall(() =>
      authFetch<AgencyOnboarding>('/agency/onboarding/submit', { method: 'POST' })
    );
  },
};
