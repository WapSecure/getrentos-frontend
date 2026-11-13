export type TrustReviewCaseStatus = 'OPEN' | 'ASSIGNED' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
export type TrustReviewCasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TrustReviewDecision = 'PASS' | 'REJECT' | 'RESTRICT';

export interface TrustReviewCaseVerificationRef {
  id: string;
  subjectType: string;
  subjectId: string;
  purpose: string;
  decision: string;
  status: string;
  createdAt: string;
}

export interface TrustReviewCaseSummary {
  id: string;
  verificationId: string;
  status: TrustReviewCaseStatus;
  priority: TrustReviewCasePriority;
  assigneeId?: string | null;
  openedById?: string | null;
  resolvedById?: string | null;
  reasonCodes: string[];
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  verification?: TrustReviewCaseVerificationRef;
  /** Diaspora identity cases only: staff answer by the end of the 2nd Lagos working day. */
  dueAt?: string | null;
  overdue?: boolean;
}

export interface TrustEvidenceItem {
  code: string;
  label: string;
  stepType?: string;
}

export interface TrustReviewStep {
  id: string;
  stepType: string;
  status: string;
  provider?: string | null;
  attempts: number;
  result?: unknown;
}

export interface TrustReviewDecisionRow {
  id: string;
  decision: string;
  reasonCodes: string[];
  decidedBy?: string | null;
  createdAt: string;
}

export interface TrustReviewAction {
  id: string;
  actorId: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface TrustReviewCaseDetail {
  id: string;
  verificationId: string;
  status: TrustReviewCaseStatus;
  priority: TrustReviewCasePriority;
  assigneeId?: string | null;
  openedById?: string | null;
  resolvedById?: string | null;
  reasonCodes: string[];
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  subject?: { id: string; legalName?: string; email?: string };
  /** Diaspora identity cases only. */
  dueAt?: string | null;
  verification: {
    id: string;
    subjectType: string;
    subjectId: string;
    purpose: string;
    status: string;
    decision: string;
    createdAt: string;
    evidenceChecklist?: TrustEvidenceItem[];
    steps: TrustReviewStep[];
    decisions: TrustReviewDecisionRow[];
  };
  actions: TrustReviewAction[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type TierGrantState = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface TierGrant {
  id: string;
  verificationId: string;
  userId: string;
  userEmail?: string | null;
  state: TierGrantState;
  reason?: string | null;
  grantedById?: string | null;
  grantedByName?: string | null;
  grantedAt: string;
  expiresAt?: string | null;
  revokedById?: string | null;
  revokedByName?: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
  effective: boolean;
}

export type TrustAppealTargetType = 'PROPERTY_AUTHORITY' | 'TRUST_VERIFICATION';
export type TrustAppealStatus = 'OPEN' | 'UNDER_REVIEW' | 'UPHELD' | 'OVERTURNED' | 'CLOSED';
export type TrustAppealDecision = 'UPHELD' | 'OVERTURNED';

export interface TrustAppeal {
  id: string;
  subjectUserId: string;
  targetType: TrustAppealTargetType;
  targetId: string;
  originalDeciderId?: string | null;
  reason: string;
  status: TrustAppealStatus;
  reviewerId?: string | null;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  subjectName?: string | null;
  subjectEmail?: string | null;
  originalDeciderName?: string | null;
  targetReference?: string | null;
  targetLabel?: string | null;
}

/**
 * Staff-reviewed Diaspora Invest uploads on the same review endpoints: identity (decision D3) and
 * source of funds (DIA-07, decision D4).
 */
export type ForeignPurpose =
  | 'FOREIGN_IDENTITY'
  | 'FOREIGN_ADDRESS'
  | 'FOREIGN_BANK_STATEMENT'
  | 'SOURCE_OF_FUNDS';

/** GET /admin/trust/foreign-identity/review-cases, soonest due first. */
export interface ForeignReviewCaseSummary {
  id: string;
  status: TrustReviewCaseStatus;
  priority: TrustReviewCasePriority;
  purpose: ForeignPurpose;
  subjectId: string;
  assigneeId: string | null;
  reasonCodes: string[];
  dueAt: string | null;
  overdue: boolean;
  createdAt: string;
}

/** One upload or Smile ID result on a diaspora case. `url` is null for Smile results and files removed by retention. */
export interface ForeignCaseDocument {
  id: string;
  category: string;
  source: string;
  summary: Record<string, unknown> | null;
  capturedAt: string;
  url: string | null;
  urlExpiresInSeconds: number | null;
}

/** GET :id/documents: links last 15 minutes, every opening is audited, never your own account. */
export interface ForeignCaseDocuments {
  caseId: string;
  purpose: ForeignPurpose;
  dueAt: string | null;
  items: ForeignCaseDocument[];
}
