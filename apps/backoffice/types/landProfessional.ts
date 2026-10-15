/** Land professional accreditation for staff (blueprint §19.1); mirrors the backend. */

export type LandProfessionalRole = 'SURVEYOR' | 'LAWYER' | 'VALUER' | 'INSPECTOR';
export type LandProfessionalStatus =
  | 'APPLIED'
  | 'ACCREDITED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'EXPIRED';
export type LandReviewAuditOutcome = 'PASS' | 'FINDINGS' | 'FAIL';

export interface AdminLandProfessionalRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: LandProfessionalRole;
  status: LandProfessionalStatus;
  regulator: string;
  licenceNumber: string;
  licenceExpiresAt?: string;
  practiceStates: string[];
  appealPending: boolean;
  createdAt: string;
}

export interface LandProfessionalPerformance {
  engagements: number;
  completed: number;
  onTime: number;
  revoked: number;
  audited: number;
  auditFindings: number;
  auditFailures: number;
  auditsPending: number;
}

export interface LandProfessionalEngagement {
  seatId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'REVOKED';
  propertyId: string;
  propertyTitle: string;
  state: string;
  dueAt?: string;
  completedAt?: string;
  audit?: { outcome: LandReviewAuditOutcome | null; note: string | null };
}

export interface AdminLandProfessional {
  id: string;
  name: string;
  email: string;
  role: LandProfessionalRole;
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
  decidedByName?: string;
  decisionNote?: string;
  suspendedReason?: string;
  suspendedAt?: string;
  appealReason?: string;
  appealedAt?: string;
  createdAt: string;
  performance: LandProfessionalPerformance;
  engagements: LandProfessionalEngagement[];
}

export interface PendingReviewAudit {
  seatId: string;
  role: LandProfessionalRole;
  professionalName: string;
  propertyId: string;
  propertyTitle: string;
  completedAt?: string;
  report: string;
}

export const LAND_PROFESSIONAL_ROLE_LABELS: Record<LandProfessionalRole, string> = {
  SURVEYOR: 'Surveyor',
  LAWYER: 'Lawyer',
  VALUER: 'Valuer',
  INSPECTOR: 'Inspector',
};

export const LAND_PROFESSIONAL_STATUS_LABELS: Record<LandProfessionalStatus, string> = {
  APPLIED: 'Applied',
  ACCREDITED: 'Accredited',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
  EXPIRED: 'Expired',
};

export const LAND_PROFESSIONAL_STATUS_VARIANT: Record<
  LandProfessionalStatus,
  'success' | 'warning' | 'danger' | 'neutral'
> = {
  ACCREDITED: 'success',
  APPLIED: 'warning',
  REJECTED: 'neutral',
  SUSPENDED: 'danger',
  EXPIRED: 'neutral',
};
