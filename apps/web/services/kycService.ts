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

  /** Submits a realtor/agent license (multipart) for human review. */
  async submitLicense(params: {
    licenseNumber: string;
    document?: File;
  }): Promise<ApiResponse<LicenseKyc>> {
    return safeCall(async () => {
      const form = new FormData();
      form.append('licenseNumber', params.licenseNumber);
      if (params.document) form.append('document', params.document);
      return authFetch<LicenseKyc>('/users/me/kyc/license', {
        method: 'POST',
        body: form,
      });
    });
  },
};
