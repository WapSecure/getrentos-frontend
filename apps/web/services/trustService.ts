import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

/** Client types mirroring the backend trust API. */
export type TrustSubjectType =
  | 'PERSON'
  | 'BUSINESS'
  | 'PROPERTY'
  | 'AGENT'
  | 'LANDLORD'
  | 'PROPERTY_OWNER'
  | 'PROPERTY_MANAGER'
  | 'REALTOR'
  | 'TRANSACTION';

export type TrustPurpose =
  | 'RENTER_ONBOARDING'
  | 'LANDLORD_ONBOARDING'
  | 'AGENT_ONBOARDING'
  | 'PROPERTY_OWNER_ONBOARDING'
  | 'PROPERTY_MANAGER_ONBOARDING'
  | 'ACCOUNT_RECOVERY'
  | 'STEP_UP'
  | 'HIGH_VALUE_TRANSACTION'
  | 'PROPERTY_LISTING'
  | 'OWNERSHIP_CLAIM';

export type TrustIdType = 'NIN' | 'BVN' | 'PASSPORT' | 'DRIVERS_LICENCE';

export const TRUST_ID_TYPES: TrustIdType[] = ['NIN', 'BVN', 'PASSPORT', 'DRIVERS_LICENCE'];

export interface TrustVerificationDto {
  id: string;
  subjectType: string;
  subjectId: string;
  purpose: string;
  status: string;
  decision: string;
  policyId: string;
  policyVersion: number;
  createdAt: string;
  completedAt?: string | null;
  stepCount: number;
  passedSteps: number;
}

export interface TrustStepDto {
  id: string;
  stepType: string;
  status: string;
  provider?: string | null;
  attempts: number;
  result?: unknown;
  completedAt?: string | null;
}

export interface TrustDecisionDto {
  id: string;
  decision: string;
  reasonCodes: string[];
  decidedBy?: string | null;
  createdAt: string;
}

export interface TrustVerificationDetailDto extends TrustVerificationDto {
  steps: TrustStepDto[];
  decisions: TrustDecisionDto[];
}

export interface TrustIdentityStepOutcome {
  verificationId: string;
  stepType: string;
  status: string;
  provider?: string | null;
  match?: { name: string; dob: string };
}

export interface TrustConsentDto {
  id: string;
  consentType: string;
  purpose?: string;
  version: number;
  grantedAt: string;
  expiresAt?: string;
  revokedAt?: string;
}

export const trustService = {
  /** Start (or idempotently resume) a PERSON verification for the signed-in user. */
  async startVerification(input: {
    subjectId: string;
    purpose: TrustPurpose;
    country?: string;
  }): Promise<ApiResponse<TrustVerificationDto>> {
    return safeCall(() =>
      authFetch<TrustVerificationDto>('/trust/verifications', {
        method: 'POST',
        body: JSON.stringify({
          subjectType: 'PERSON',
          subjectId: input.subjectId,
          purpose: input.purpose,
          country: input.country ?? 'NG',
        }),
      })
    );
  },

  async getVerification(id: string): Promise<ApiResponse<TrustVerificationDetailDto>> {
    return safeCall(() => authFetch<TrustVerificationDetailDto>(`/trust/verifications/${id}`));
  },

  async submitIdentity(
    verificationId: string,
    input: {
      idType: TrustIdType;
      idNumber: string;
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      country?: string;
    }
  ): Promise<ApiResponse<TrustIdentityStepOutcome>> {
    return safeCall(() =>
      authFetch<TrustIdentityStepOutcome>(`/trust/verifications/${verificationId}/identity`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  async listConsents(): Promise<ApiResponse<TrustConsentDto[]>> {
    return safeCall(() => authFetch<TrustConsentDto[]>('/trust/consents'));
  },

  async grantConsent(input: {
    consentType: string;
    purpose?: string;
    expiresInDays?: number;
  }): Promise<ApiResponse<TrustConsentDto>> {
    return safeCall(() =>
      authFetch<TrustConsentDto>('/trust/consents', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  async revokeConsent(id: string): Promise<ApiResponse<TrustConsentDto>> {
    return safeCall(() =>
      authFetch<TrustConsentDto>(`/trust/consents/${id}/revoke`, { method: 'POST' })
    );
  },
};
