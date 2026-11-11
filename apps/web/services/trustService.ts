import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { TrustExplanation, TrustOverview, TrustPortal } from '@/types/trust-score';

export interface SmileLivenessSession {
  token: string;
  partnerId: string;
  userId: string;
  useSandbox: boolean;
  consent: {
    granted: true;
    grantedAt: string;
    noticeLanguage: string;
    noticePrivacyPolicyUrl: string;
  };
  userDetails: { givenNames: string; lastName: string; email?: string; phoneNumber?: string };
  /** Smile's v3 API for this environment. */
  apiUrl: string;
  callbackUrl?: string;
  /** The Smile product the token was minted for; the capture must use the same one. */
  product?: 'smart_selfie_registration' | 'smart_selfie_authentication' | 'document_verification';
  /** Document jobs: bound into the token, so the capture never asks for or sends them. */
  idInfo?: { country: string; idType: string };
}

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

export interface TrustBankAccountStepOutcome {
  verificationId: string;
  stepType: string;
  status: string;
  provider?: string | null;
  match?: { accountName: string };
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
  /** Idempotent: resumes an existing one. */
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

  /** Self-only. */
  async getOverview(portal: TrustPortal): Promise<ApiResponse<TrustOverview>> {
    return safeCall(() => authFetch<TrustOverview>(`/trust/overview?portal=${portal}`));
  },

  /** Self-only. */
  async getExplanation(): Promise<ApiResponse<TrustExplanation>> {
    return safeCall(() => authFetch<TrustExplanation>('/trust-score/explanation'));
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

  /** Returns the challenge reference. */
  async sendPhoneOtp(verificationId: string): Promise<ApiResponse<{ reference: string }>> {
    return safeCall(() =>
      authFetch<{ reference: string }>(`/trust/verifications/${verificationId}/phone-otp/send`, {
        method: 'POST',
      })
    );
  },

  async verifyPhoneOtp(
    verificationId: string,
    input: { reference: string; code: string }
  ): Promise<ApiResponse<TrustVerificationDto>> {
    return safeCall(() =>
      authFetch<TrustVerificationDto>(`/trust/verifications/${verificationId}/phone-otp/verify`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  /** The token is bound server-side to this user, our webhook and the recorded consent. */
  async startLivenessSession(verificationId: string): Promise<ApiResponse<SmileLivenessSession>> {
    return safeCall(() =>
      authFetch<SmileLivenessSession>(`/trust/verifications/${verificationId}/liveness/session`, {
        method: 'POST',
      })
    );
  },

  /** For a late webhook: the server queries Smile itself; this only names the job. */
  async checkLiveness(
    verificationId: string,
    jobId: string
  ): Promise<ApiResponse<{ status: 'pending' | 'applied' | 'settled' }>> {
    return safeCall(() =>
      authFetch<{ status: 'pending' | 'applied' | 'settled' }>(
        `/trust/verifications/${verificationId}/liveness/check`,
        { method: 'POST', body: JSON.stringify({ jobId }) }
      )
    );
  },

  async submitBankAccount(
    verificationId: string,
    input: {
      accountNumber: string;
      accountName?: string;
      bankCode?: string;
      country?: string;
    }
  ): Promise<ApiResponse<TrustBankAccountStepOutcome>> {
    return safeCall(() =>
      authFetch<TrustBankAccountStepOutcome>(`/trust/verifications/${verificationId}/bank`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  async submitDocument(
    verificationId: string,
    input: {
      documentType: string;
      documentNumber: string;
      holderName?: string;
      country?: string;
    }
  ): Promise<ApiResponse<TrustDocumentStepOutcome>> {
    return safeCall(() =>
      authFetch<TrustDocumentStepOutcome>(`/trust/verifications/${verificationId}/document`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  /** Idempotent: resumes an existing one. */
  async startPropertyVerification(
    propertyId: string,
    purpose: 'PROPERTY_LISTING' | 'OWNERSHIP_CLAIM' = 'PROPERTY_LISTING',
    country = 'NG'
  ): Promise<ApiResponse<TrustVerificationDto>> {
    return safeCall(() =>
      authFetch<TrustVerificationDto>('/trust/verifications', {
        method: 'POST',
        body: JSON.stringify({ subjectType: 'PROPERTY', subjectId: propertyId, purpose, country }),
      })
    );
  },

  async submitPropertyAddress(
    verificationId: string,
    input: { address: string; city?: string; state?: string; country?: string }
  ): Promise<ApiResponse<TrustPropertyStepOutcome>> {
    return safeCall(() =>
      authFetch<TrustPropertyStepOutcome>(
        `/trust/verifications/${verificationId}/property/address`,
        { method: 'POST', body: JSON.stringify(input) }
      )
    );
  },

  /** Needs DOCUMENT_PROCESSING consent. */
  async submitPropertyDocument(
    verificationId: string,
    input: {
      documentType: string;
      documentNumber?: string;
      ownerName?: string;
      country?: string;
    }
  ): Promise<ApiResponse<TrustPropertyStepOutcome>> {
    return safeCall(() =>
      authFetch<TrustPropertyStepOutcome>(
        `/trust/verifications/${verificationId}/property/document`,
        { method: 'POST', body: JSON.stringify(input) }
      )
    );
  },

  /** Both sides are resolved server-side. */
  async submitOwnershipCheck(
    verificationId: string,
    country = 'NG'
  ): Promise<ApiResponse<TrustPropertyStepOutcome>> {
    return safeCall(() =>
      authFetch<TrustPropertyStepOutcome>(
        `/trust/verifications/${verificationId}/property/ownership`,
        { method: 'POST', body: JSON.stringify({ country }) }
      )
    );
  },
};

export interface TrustPropertyStepOutcome {
  verificationId: string;
  stepType: string;
  status: string;
  provider?: string | null;
  match?: Record<string, string>;
}

export interface TrustDocumentStepOutcome {
  verificationId: string;
  stepType: string;
  status: string;
  provider?: string | null;
  match?: { holderName: string };
}
