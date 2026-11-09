import type { LandReviewerRole } from './landReviewer';

/**
 * Mirrors the backend's `land-professional.service.ts`. Only accredited professionals, in date and
 * covering the parcel's state, can be engaged.
 */

export type LandProfessionalStatus =
  | 'APPLIED'
  | 'ACCREDITED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'EXPIRED';

export interface LandProfessional {
  id: string;
  role: LandReviewerRole;
  status: LandProfessionalStatus;
  regulator: string;
  licenceNumber: string;
  licenceExpiresAt?: string;
  practiceStates: string[];
  insurer?: string;
  insuranceExpiresAt?: string;
  credentialUrl?: string;
  credentialFileHash?: string;
  decidedAt?: string;
  decisionNote?: string;
  suspendedReason?: string;
  suspendedAt?: string;
  appealReason?: string;
  appealedAt?: string;
  createdAt: string;
}

export interface ApplyLandProfessionalInput {
  role: LandReviewerRole;
  regulator?: string;
  licenceNumber: string;
  licenceExpiresAt?: string;
  practiceStates: string[];
  insurer?: string;
  insuranceExpiresAt?: string;
  file?: File;
}

export const LAND_PROFESSIONAL_STATUS_LABELS: Record<LandProfessionalStatus, string> = {
  APPLIED: 'Under review',
  ACCREDITED: 'Accredited',
  REJECTED: 'Not approved',
  SUSPENDED: 'Suspended',
  EXPIRED: 'Expired',
};

/** Matches the backend default. */
export const LAND_PROFESSIONAL_REGULATORS: Record<LandReviewerRole, string> = {
  SURVEYOR: 'SURCON',
  LAWYER: 'NBA',
  VALUER: 'ESVARBON',
  INSPECTOR: 'Sureground field certification',
};
