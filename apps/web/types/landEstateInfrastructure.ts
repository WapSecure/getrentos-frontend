/** What a developer promised to build on an estate (roads, power, water...). */
export const ESTATE_COMMITMENT_KINDS = [
  'ROADS',
  'DRAINAGE',
  'POWER',
  'WATER',
  'PERIMETER_FENCE',
  'GATEHOUSE',
  'STREET_LIGHTS',
  'OTHER',
] as const;
export type EstateCommitmentKind = (typeof ESTATE_COMMITMENT_KINDS)[number];

export type EstateCommitmentStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'VERIFIED'
  | 'DISPUTED';

export type EstateChangeOrderKind = 'DATE_CHANGE' | 'SCOPE_CHANGE' | 'WITHDRAWAL';
export type EstateChangeResponse = 'ACKNOWLEDGED' | 'OBJECTED';

export interface EstateCommitmentUpdate {
  status: EstateCommitmentStatus;
  note: string;
  byRole: 'DEVELOPER' | 'BUYER' | 'STAFF';
  byName: string;
  hasEvidence: boolean;
  /** Developer and staff views only. */
  documentId?: string;
  at: string;
}

export interface EstateOpenChange {
  id: string;
  kind: EstateChangeOrderKind;
  reason: string;
  newTargetDate?: string;
  newDescription?: string;
  respondBy: string;
  /** Developer and staff views only. */
  acknowledged?: number;
  objected?: number;
  /** Buyer view: this purchase's answer, once given. */
  myResponse?: EstateChangeResponse;
}

export interface EstateCommitment {
  id: string;
  kind: EstateCommitmentKind;
  kindLabel: string;
  title: string;
  description: string;
  status: EstateCommitmentStatus;
  targetDate?: string;
  overdue: boolean;
  withdrawn: boolean;
  deliveredAt?: string;
  verifiedAt?: string;
  evidenceCount: number;
  /** Absent on the public estate page. */
  updates?: EstateCommitmentUpdate[];
  openChange?: EstateOpenChange;
}

export interface EstateCommitmentInput {
  kind: EstateCommitmentKind;
  title: string;
  description: string;
  targetDate?: string;
}

export interface EstateProgressInput {
  status: 'IN_PROGRESS' | 'DELIVERED';
  note: string;
  documentId?: string;
}

export interface EstateChangeOrderInput {
  commitmentId: string;
  kind: EstateChangeOrderKind;
  reason: string;
  newTargetDate?: string;
  newDescription?: string;
}
