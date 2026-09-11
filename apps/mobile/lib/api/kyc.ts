import { apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';

/** Mirrors `IDENTITY_DOCUMENT_TYPES` in the backend's submit-identity.dto.ts. */
export const IDENTITY_DOCUMENT_TYPES = [
  'NATIONAL_ID',
  'PASSPORT',
  'DRIVERS_LICENSE',
  'VOTERS_CARD',
  'NIN',
  'BVN',
] as const;
export type IdentityDocumentType = (typeof IDENTITY_DOCUMENT_TYPES)[number];

export const IDENTITY_DOCUMENT_LABEL: Record<IdentityDocumentType, string> = {
  NATIONAL_ID: 'National ID',
  PASSPORT: 'International passport',
  DRIVERS_LICENSE: "Driver's licence",
  VOTERS_CARD: "Voter's card",
  NIN: 'NIN slip',
  BVN: 'BVN',
};

export type KycStatus = 'PENDING_REVIEW' | 'NEEDS_CLARIFICATION' | 'APPROVED' | 'REJECTED';

export interface IdentityKyc {
  id: string;
  documentType: string;
  status: KycStatus;
  submittedAt: string;
  rejectionReason?: string;
}

export interface KycStatusResponse {
  isVerified: boolean;
  verificationStatus: string;
  trustScore: number;
  tier?: number;
  identity?: IdentityKyc;
}

export const kycApi = {
  getStatus: () => apiFetch<KycStatusResponse>('/users/me/kyc'),

  submitIdentity: (params: {
    documentType: IdentityDocumentType;
    document: PickedFile;
    selfie?: PickedFile;
    note?: string;
  }) => {
    const form = new FormData();
    appendFile(form, 'document', params.document);
    if (params.selfie) appendFile(form, 'selfie', params.selfie);
    form.append('documentType', params.documentType);
    if (params.note) form.append('note', params.note);
    return apiUpload<IdentityKyc>('/users/me/kyc/identity', form);
  },
};
