import type { CoApprovalPendingStep, DepositReleaseApprovalOutcome } from '@sureground/shared';
import type { LandMilestone } from './landBuyer';

export type { CoApprovalPendingStep } from '@sureground/shared';

/** Mirrors the backend's `land-representative.service.ts`. */

export type RepresentativeScope = 'VIEW' | 'CO_APPROVE' | 'ATTEND';
export type RepresentativeRelationship = 'FAMILY' | 'LAWYER' | 'FRIEND' | 'AGENT' | 'OTHER';
export type RepresentativeStatus = 'INVITED' | 'ACTIVE' | 'DECLINED' | 'REVOKED';

/** `name`/`email` are the other person. */
export interface LandRepresentativeAppointment {
  id: string;
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

export interface CoApprovalView {
  binding: boolean;
  status?: 'ACTIVE' | 'DISABLE_PENDING' | 'DISABLED';
  disableEffectiveAt?: string;
  representative?: { appointmentId: string; name?: string };
  pending?: CoApprovalPendingStep[];
  /** Both approved the deposit release; the buyer still has to press Release. */
  releaseApproved?: boolean;
}

/** A representative's second approval to a deposit release; never moves money itself. */
export type DepositReleaseApproval = CoApprovalView & { outcome: DepositReleaseApprovalOutcome };

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
  VIEW: 'See my purchases, their steps and documents',
  CO_APPROVE: 'Give the second approval before money is released to a seller',
  ATTEND: 'Attend site visits and tours for me',
};

/** For tables, where the full sentences do not fit. */
export const REPRESENTATIVE_SCOPE_SHORT_LABELS: Record<RepresentativeScope, string> = {
  VIEW: 'See purchases',
  CO_APPROVE: 'Approve the release',
  ATTEND: 'Attend visits',
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
