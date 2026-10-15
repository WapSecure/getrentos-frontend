export type LandDisputeKind =
  | 'FRAUD'
  | 'COMPETING_CLAIM'
  | 'BOUNDARY'
  | 'TITLE_DEFECT'
  | 'NON_DELIVERY'
  | 'PAYMENT'
  | 'OTHER';

export const LAND_DISPUTE_KINDS: { value: LandDisputeKind; label: string; hint: string }[] = [
  { value: 'FRAUD', label: 'Fraud', hint: 'Forged documents, or the seller has no right to sell' },
  {
    value: 'COMPETING_CLAIM',
    label: 'Someone else claims the land',
    hint: 'A family, community or another buyer',
  },
  { value: 'BOUNDARY', label: 'Boundary problem', hint: 'Beacons, encroachment or the wrong plot' },
  { value: 'TITLE_DEFECT', label: 'Title problem', hint: 'A defect, caveat or missing consent' },
  {
    value: 'NON_DELIVERY',
    label: 'Not delivered',
    hint: 'A conveyance step paid for and not done',
  },
  { value: 'PAYMENT', label: 'Payment problem', hint: 'A charge, refund or payout issue' },
  { value: 'OTHER', label: 'Something else', hint: '' },
];

export interface LandDisputeEvidence {
  id: string;
  fileName: string;
  sizeBytes: number;
  fileHash: string;
  source: 'PARTY' | 'ADMIN';
  url: string;
  uploadedByMe: boolean;
  note?: string;
  createdAt: string;
}

export interface LandDisputeEvent {
  id: string;
  action: string;
  note?: string;
  createdAt: string;
}

/** A land dispute as a party sees it: no reporter identity, own evidence plus staff evidence. */
export interface LandDispute {
  id: string;
  reference: string;
  propertyId: string;
  propertyTitle: string;
  purchaseId?: string;
  purchaseReference?: string;
  kind: LandDisputeKind;
  description: string;
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'APPEALED' | 'CLOSED';
  myRoles: ('reporter' | 'owner' | 'buyer')[];
  holdActive: boolean;
  holdReason?: string;
  outcome?: 'UPHELD' | 'DISMISSED';
  decision?: string;
  decidedAt?: string;
  appealReason?: string;
  appealedAt?: string;
  appealOutcome?: 'UPHELD' | 'DISMISSED';
  appealDecision?: string;
  canAppeal: boolean;
  appealDeadline?: string;
  evidence: LandDisputeEvidence[];
  events: LandDisputeEvent[];
  createdAt: string;
}
