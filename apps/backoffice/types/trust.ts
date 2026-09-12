/** Trust & verification review-case types (mirror backend /admin/trust/review-cases). */

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
  verification: {
    id: string;
    subjectType: string;
    subjectId: string;
    purpose: string;
    status: string;
    decision: string;
    createdAt: string;
    steps: TrustReviewStep[];
    decisions: TrustReviewDecisionRow[];
  };
  actions: TrustReviewAction[];
}

/** Standard server-side paginated envelope. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Manual tier-3 (financial capability) grant. */
export type TierGrantState = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface TierGrant {
  id: string;
  verificationId: string;
  userId: string;
  userEmail?: string | null;
  state: TierGrantState;
  reason?: string | null;
  grantedById?: string | null;
  grantedAt: string;
  expiresAt?: string | null;
  revokedById?: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
  /** Whether this grant is the one the tier resolver currently counts. */
  effective: boolean;
}
