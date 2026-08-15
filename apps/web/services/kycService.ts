import { apiFetch } from '@/lib/apiClient';
import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

export interface KycItem {
  id: string;
  status: string;
  submittedAt: string;
  rejectionReason?: string;
}

export interface IdentityKyc extends KycItem {
  documentType: string;
  selfieUrl?: string;
  /** 0-1 face-similarity when automatic face matching ran. */
  matchScore?: number;
  /** User id or 'AUTO_FACE_MATCH'. */
  verifiedBy?: string;
}

export interface PreVerifyResult {
  status: 'APPROVED' | 'REJECTED' | 'PENDING_REVIEW';
  score: number;
  message: string;
  nextStep?: 'proceed' | 'retry' | 'manual_review';
}

export interface LicenseKyc extends KycItem {
  licenseNumber: string;
}

export interface OwnershipProofKyc extends KycItem {
  propertyId: string;
  propertyTitle: string;
  documentType: string;
}

export interface KycStatus {
  isVerified: boolean;
  verificationStatus: string;
  trustScore: number;
  identity?: IdentityKyc;
  license?: LicenseKyc;
  ownershipProofs?: OwnershipProofKyc[];
}

/** Mirrors IDENTITY_DOCUMENT_TYPES in the backend's submit-identity.dto.ts. */
export const IDENTITY_DOCUMENT_TYPES = [
  'NATIONAL_ID',
  'PASSPORT',
  'DRIVERS_LICENSE',
  'VOTERS_CARD',
  'NIN',
  'BVN',
] as const;

export type IdentityDocumentType = (typeof IDENTITY_DOCUMENT_TYPES)[number];

export const ID_TYPE_TO_BACKEND: Record<string, IdentityDocumentType> = {
  nin: 'NIN',
  voters: 'VOTERS_CARD',
  drivers: 'DRIVERS_LICENSE',
  passport: 'PASSPORT',
};

export const kycService = {
  async getStatus(): Promise<ApiResponse<KycStatus>> {
    return safeCall(() => authFetch<KycStatus>('/users/me/kyc'));
  },

  /** Submits identity documents (multipart) for human review. */
  async submitIdentity(params: {
    document: File;
    selfie?: File;
    documentType: IdentityDocumentType;
    note?: string;
  }): Promise<ApiResponse<IdentityKyc>> {
    return safeCall(async () => {
      const form = new FormData();
      form.append('document', params.document);
      if (params.selfie) form.append('selfie', params.selfie);
      form.append('documentType', params.documentType);
      if (params.note) form.append('note', params.note);
      return authFetch<IdentityKyc>('/users/me/kyc/identity', {
        method: 'POST',
        body: form,
      });
    });
  },

  async preVerify(params: {
    reference: string;
    document: File;
    selfie?: File;
    documentType: IdentityDocumentType;
  }): Promise<ApiResponse<PreVerifyResult>> {
    return safeCall(async () => {
      const form = new FormData();
      form.append('reference', params.reference);
      form.append('documentType', params.documentType);
      form.append('document', params.document);
      if (params.selfie) form.append('selfie', params.selfie);
      return apiFetch<PreVerifyResult>('/auth/pre-verify', {
        method: 'POST',
        body: form,
      });
    });
  },
};
