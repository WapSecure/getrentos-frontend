import type { LandMilestone } from './landBuyer';

/**
 * Diaspora mode (blueprint §8.4), mirroring the backend's
 * `land-representative.service.ts`: people a buyer appoints to act for them,
 * and the two-person rule on releasing money.
 */

export type RepresentativeScope = 'VIEW' | 'CO_APPROVE' | 'ATTEND';
export type RepresentativeRelationship = 'FAMILY' | 'LAWYER' | 'FRIEND' | 'AGENT' | 'OTHER';
export type RepresentativeStatus = 'INVITED' | 'ACTIVE' | 'DECLINED' | 'REVOKED';

/** An appointment, seen by either side: `name`/`email` are the other person. */
export interface LandRepresentativeAppointment {
  id: string;
  /** The buyer being represented. */
  principalId: string;
  relationship: RepresentativeRelationship;
  scopes: RepresentativeScope[];
  status: RepresentativeStatus;
  note?: string;
  name?: string;
  email?: string;
  acceptedAt?: string;
  endedAt?: string;
  endedReason?: string;
  createdAt: string;
}

export interface CoApprovalPendingStep {
  milestoneKey: string;
  buyerApproved: boolean;
  representativeApproved: boolean;
}

export interface CoApprovalView {
  binding: boolean;
  status?: 'ACTIVE' | 'DISABLE_PENDING' | 'DISABLED';
  disableEffectiveAt?: string;
  representative?: { appointmentId: string; name?: string };
  pending?: CoApprovalPendingStep[];
}

export interface PrincipalDeals {
  purchases: {
    purchaseId: string;
    reference: string;
    status: string;
    title: string;
    youApprovePayments: boolean;
  }[];
  resales: {
    transactionId: string;
    escrowStatus: string;
    amount: number;
    title: string;
    youApprovePayments: boolean;
  }[];
}

export type ResaleSteps = LandMilestone[];

export const REPRESENTATIVE_SCOPE_LABELS: Record<RepresentativeScope, string> = {
  VIEW: 'See my land purchases, their steps and documents',
  CO_APPROVE: 'Give the second approval before money is released to a seller',
  ATTEND: 'Attend site visits and tours for me',
};

export const REPRESENTATIVE_RELATIONSHIP_LABELS: Record<RepresentativeRelationship, string> = {
  FAMILY: 'Family',
  LAWYER: 'Lawyer',
  FRIEND: 'Friend',
  AGENT: 'Agent',
  OTHER: 'Other',
};

export const REPRESENTATIVE_STATUS_LABELS: Record<RepresentativeStatus, string> = {
  INVITED: 'Invited',
  ACTIVE: 'Active',
  DECLINED: 'Declined',
  REVOKED: 'Ended',
};
