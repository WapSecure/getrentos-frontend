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

export interface LicenseKyc {
  id: string;
  licenseNumber: string;
  status: KycStatus;
  submittedAt: string;
  rejectionReason?: string;
}

export interface KycStatusResponse {
  isVerified: boolean;
  verificationStatus: string;
  trustScore: number;
  tier?: number;
  /** Gate on this: identity.status is only the older review flow and stays PENDING for someone verified by NIN. */
  identityVerified?: boolean;
  /** ISO date the identity grace period ends; after it, listings, payout accounts and withdrawals stop working. */
  identityGraceEndsAt?: string;
  identity?: IdentityKyc;
  license?: LicenseKyc;
}

export const kycApi = {
  getStatus: () => apiFetch<KycStatusResponse>('/users/me/kyc'),

  submitIdentity: (params: {
    documentType: IdentityDocumentType;
    document: PickedFile;
    selfie?: PickedFile;
    note?: string;
    /** The person ticked the consent box; the API refuses the upload without it. */
    consent: true;
  }) => {
    const form = new FormData();
    appendFile(form, 'document', params.document);
    if (params.selfie) appendFile(form, 'selfie', params.selfie);
    form.append('documentType', params.documentType);
    form.append('consent', String(params.consent));
    if (params.note) form.append('note', params.note);
    return apiUpload<IdentityKyc>('/users/me/kyc/identity', form);
  },

  submitLicense: (params: { licenseNumber: string; document?: PickedFile }) => {
    const form = new FormData();
    form.append('licenseNumber', params.licenseNumber);
    if (params.document) appendFile(form, 'document', params.document);
    return apiUpload<LicenseKyc>('/users/me/kyc/license', form);
  },
};
