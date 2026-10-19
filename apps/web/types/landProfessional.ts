import type { LandReviewerRole } from './landReviewer';

/**
 * Accreditation as a land professional (blueprint §19.1), mirroring the
 * backend's `land-professional.service.ts`. Only accredited professionals,
 * in date and covering a parcel's state, can be engaged on a case.
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

/** The register each role's licence is checked against; matches the backend default. */
export const LAND_PROFESSIONAL_REGULATORS: Record<LandReviewerRole, string> = {
  SURVEYOR: 'SURCON',
  LAWYER: 'NBA',
  VALUER: 'ESVARBON',
  INSPECTOR: 'GetRentos field certification',
};
