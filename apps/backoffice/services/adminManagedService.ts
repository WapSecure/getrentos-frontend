import type { PmKpiReport } from '@sureground/ui';
import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';

export type ManagedServicingTier = 'COLLECT_ONLY' | 'COLLECT_MAINTAIN' | 'FULL_MANAGEMENT';

export interface ManagedMandate {
  id: string;
  propertyId: string;
  propertyTitle: string | null;
  ownerName: string | null;
  servicingTier: ManagedServicingTier | null;
  managerUserId: string | null;
  managerName: string | null;
  deliveryPartnerOrganizationId: string | null;
  deliveryPartnerName: string | null;
  status: string;
  createdAt: string;
  activationChecklist?: ActivationCheck[];
  intakeId?: string | null;
}

export interface ActivationCheck {
  key: string;
  label: string;
  done: boolean;
  detail: string | null;
}

export type IntakeStatus =
  | 'SUBMITTED'
  | 'ASSESSMENT_SCHEDULED'
  | 'ASSESSED'
  | 'PROPOSED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'WITHDRAWN';

export interface ManagedIntake {
  id: string;
  status: IntakeStatus;
  proposalExpired: boolean;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyVerified: boolean;
  ownerName: string | null;
  ownerEmail: string | null;
  requestedTier: ManagedServicingTier;
  propertyClass: string;
  unitCount: number;
  occupiedUnits: number;
  annualRentRoll: number | null;
  serviceNeeds: string[];
  ownerNotes: string | null;
  indicativeFeePct: number;
  indicativeMonthlyFee: number | null;
  assessorUserId: string | null;
  assessorName: string | null;
  assessmentScheduledFor: string | null;
  assessedAt: string | null;
  condition: 'GOOD' | 'FAIR' | 'POOR' | null;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  findings: string | null;
  eligible: boolean | null;
  recommendedTier: ManagedServicingTier | null;
  visit: {
    id: string;
    status: FieldVisitStatus;
    checkedInAt: string | null;
    distanceM: number | null;
    withinRange: boolean | null;
  } | null;
  proposal: {
    tier: ManagedServicingTier;
    tierName: string;
    feePct: number | null;
    exclusions: string | null;
    note: string | null;
    proposedAt: string | null;
    expiresAt: string | null;
  } | null;
  acceptedAt: string | null;
  declinedReason: string | null;
  mandateId: string | null;
  mandateStatus: string | null;
  openingPositionNote: string | null;
  openingPositionConfirmedAt: string | null;
  createdAt: string;
}

const post = <T>(path: string, body?: unknown): Promise<ApiResponse<T>> =>
  safeCall(() =>
    authFetch<T>(path, { method: 'POST', ...(body ? { body: JSON.stringify(body) } : {}) })
  );

export const adminManagedIntakeService = {
  list(status?: IntakeStatus): Promise<ApiResponse<ManagedIntake[]>> {
    return safeCall(() =>
      authFetch<ManagedIntake[]>(`/admin/managed-intakes${status ? `?status=${status}` : ''}`)
    );
  },
  scheduleAssessment(id: string, assessorUserId: string, scheduledFor: string) {
    return post<ManagedIntake>(`/admin/managed-intakes/${id}/schedule-assessment`, {
      assessorUserId,
      scheduledFor,
    });
  },
  recordAssessment(
    id: string,
    input: {
      condition: 'GOOD' | 'FAIR' | 'POOR';
      risk: 'LOW' | 'MEDIUM' | 'HIGH';
      findings: string;
      eligible: boolean;
      recommendedTier?: ManagedServicingTier;
    }
  ) {
    return post<ManagedIntake>(`/admin/managed-intakes/${id}/assessment`, input);
  },
  propose(id: string, input: { tier: ManagedServicingTier; exclusions?: string; note?: string }) {
    return post<ManagedIntake>(`/admin/managed-intakes/${id}/propose`, input);
  },
  decline(id: string, reason: string) {
    return post<ManagedIntake>(`/admin/managed-intakes/${id}/decline`, { reason });
  },
  confirmOpeningPosition(id: string, note: string) {
    return post<ManagedIntake>(`/admin/managed-intakes/${id}/opening-position`, { note });
  },
};

export interface PartnerFirm {
  id: string;
  name: string;
}

export interface PortfolioManagerOption {
  id: string;
  name: string;
  email: string | null;
}

export interface ManagedQueueCounts {
  awaitingActivation: number;
  terminationRequests: number;
}

export const adminManagedService = {
  listPending(): Promise<ApiResponse<ManagedMandate[]>> {
    return safeCall(() =>
      authFetch<ManagedMandate[]>('/admin/management-mandates/managed-pending')
    );
  },

  listActive(): Promise<ApiResponse<ManagedMandate[]>> {
    return safeCall(() => authFetch<ManagedMandate[]>('/admin/management-mandates/managed-active'));
  },

  listPortfolioManagers(): Promise<ApiResponse<PortfolioManagerOption[]>> {
    return safeCall(() =>
      authFetch<PortfolioManagerOption[]>('/admin/management-mandates/portfolio-managers')
    );
  },

  listPartnerFirms(): Promise<ApiResponse<PartnerFirm[]>> {
    return safeCall(() => authFetch<PartnerFirm[]>('/admin/management-mandates/partner-firms'));
  },

  queueCounts(): Promise<ApiResponse<ManagedQueueCounts>> {
    return safeCall(() => authFetch<ManagedQueueCounts>('/admin/management-mandates/queue-counts'));
  },

  activate(
    id: string,
    managerUserId: string,
    deliveryPartnerOrganizationId?: string
  ): Promise<ApiResponse<ManagedMandate>> {
    return safeCall(() =>
      authFetch<ManagedMandate>(`/admin/management-mandates/${id}/activate-managed`, {
        method: 'POST',
        body: JSON.stringify({
          managerUserId,
          ...(deliveryPartnerOrganizationId ? { deliveryPartnerOrganizationId } : {}),
        }),
      })
    );
  },

  activateBulk(
    mandateIds: string[],
    managerUserId: string,
    deliveryPartnerOrganizationId?: string
  ): Promise<ApiResponse<BulkActivateResult>> {
    return safeCall(() =>
      authFetch<BulkActivateResult>('/admin/management-mandates/activate-managed-bulk', {
        method: 'POST',
        body: JSON.stringify({
          mandateIds,
          managerUserId,
          ...(deliveryPartnerOrganizationId ? { deliveryPartnerOrganizationId } : {}),
        }),
      })
    );
  },

  rejectBulk(mandateIds: string[], reason: string): Promise<ApiResponse<BulkRejectResult>> {
    return safeCall(() =>
      authFetch<BulkRejectResult>('/admin/management-mandates/reject-managed-bulk', {
        method: 'POST',
        body: JSON.stringify({ mandateIds, reason }),
      })
    );
  },

  reassignBulk(
    mandateIds: string[],
    managerUserId: string
  ): Promise<ApiResponse<BulkReassignResult>> {
    return safeCall(() =>
      authFetch<BulkReassignResult>('/admin/management-mandates/reassign-manager-bulk', {
        method: 'POST',
        body: JSON.stringify({ mandateIds, managerUserId }),
      })
    );
  },

  suspendBulk(mandateIds: string[], reason: string): Promise<ApiResponse<BulkSuspendResult>> {
    return safeCall(() =>
      authFetch<BulkSuspendResult>('/admin/management-mandates/suspend-managed-bulk', {
        method: 'POST',
        body: JSON.stringify({ mandateIds, reason }),
      })
    );
  },

  resumeBulk(mandateIds: string[]): Promise<ApiResponse<BulkResumeResult>> {
    return safeCall(() =>
      authFetch<BulkResumeResult>('/admin/management-mandates/resume-managed-bulk', {
        method: 'POST',
        body: JSON.stringify({ mandateIds }),
      })
    );
  },

  requestTerminationBulk(
    mandateIds: string[],
    reason: string
  ): Promise<ApiResponse<BulkRequestTerminationResult>> {
    return safeCall(() =>
      authFetch<BulkRequestTerminationResult>(
        '/admin/management-mandates/request-termination-bulk',
        { method: 'POST', body: JSON.stringify({ mandateIds, reason }) }
      )
    );
  },

  listTerminationRequests(): Promise<ApiResponse<TerminationRequest[]>> {
    return safeCall(() =>
      authFetch<TerminationRequest[]>('/admin/management-mandates/termination-requests')
    );
  },

  approveTerminationBulk(
    mandateIds: string[],
    decisionNote: string
  ): Promise<ApiResponse<BulkApproveTerminationResult>> {
    return safeCall(() =>
      authFetch<BulkApproveTerminationResult>(
        '/admin/management-mandates/approve-termination-bulk',
        { method: 'POST', body: JSON.stringify({ mandateIds, decisionNote }) }
      )
    );
  },
};

export interface TerminationRequest {
  id: string;
  mandateId: string;
  requestedById: string;
  requestedByName: string | null;
  reason: string;
  status: string;
  createdAt: string;
  propertyId: string;
  propertyTitle: string | null;
  managerIsSureground: boolean;
  ownerName: string | null;
  noticePeriodDays: number;
  noticeServedAt: string | null;
}

export interface BulkActivateResult {
  requested: number;
  activated: number;
  skipped: { id: string; reason: string }[];
}

export interface BulkRejectResult {
  requested: number;
  rejected: number;
  skipped: { id: string; reason: string }[];
}

export interface BulkReassignResult {
  requested: number;
  reassigned: number;
  skipped: { id: string; reason: string }[];
}

export interface BulkSuspendResult {
  requested: number;
  suspended: number;
  skipped: { id: string; reason: string }[];
}

export interface BulkResumeResult {
  requested: number;
  resumed: number;
  skipped: { id: string; reason: string }[];
}

export interface BulkRequestTerminationResult {
  requested: number;
  raised: number;
  skipped: { id: string; reason: string }[];
}

export interface BulkApproveTerminationResult {
  requested: number;
  approved: number;
  skipped: { id: string; reason: string }[];
}

export type FieldVisitStatus = 'SCHEDULED' | 'CHECKED_IN' | 'DONE' | 'CANCELLED';

export interface FieldVisit {
  id: string;
  kind: 'ASSESSMENT' | 'INSPECTION';
  status: FieldVisitStatus;
  overdue: boolean;
  escalatedAt: string | null;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyHasPin: boolean;
  intakeId: string | null;
  assigneeUserId: string;
  assigneeName: string | null;
  scheduledFor: string;
  purpose: string | null;
  checkedInAt: string | null;
  checkInDistanceM: number | null;
  checkInAccuracyM: number | null;
  checkInWithinRange: boolean | null;
  completedAt: string | null;
  outcomeNote: string | null;
  cancelReason: string | null;
}

export interface FieldAgent {
  userId: string;
  name: string | null;
  email: string | null;
  active: boolean;
  states: string[];
  areas: string[];
  maxOpenVisits: number;
  openVisits: number;
}

export interface FieldAgentCandidate {
  userId: string;
  name: string | null;
  covers: boolean;
  openVisits: number;
  maxOpenVisits: number;
  atCapacity: boolean;
}

export const adminFieldService = {
  agents(): Promise<ApiResponse<FieldAgent[]>> {
    return safeCall(() => authFetch<FieldAgent[]>('/admin/field-operations/agents'));
  },
  saveAgent(
    userId: string,
    input: { states: string[]; areas: string[]; maxOpenVisits: number; active: boolean }
  ): Promise<ApiResponse<FieldAgent>> {
    return safeCall(() =>
      authFetch<FieldAgent>(`/admin/field-operations/agents/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      })
    );
  },
  suggest(propertyId: string): Promise<ApiResponse<FieldAgentCandidate[]>> {
    return safeCall(() =>
      authFetch<FieldAgentCandidate[]>(`/admin/field-operations/suggest?propertyId=${propertyId}`)
    );
  },
  visits(view: 'open' | 'overdue' | 'done'): Promise<ApiResponse<FieldVisit[]>> {
    return safeCall(() => authFetch<FieldVisit[]>(`/admin/field-operations/visits?view=${view}`));
  },
  mine(): Promise<ApiResponse<FieldVisit[]>> {
    return safeCall(() => authFetch<FieldVisit[]>('/admin/field-operations/visits/mine'));
  },
  scheduleInspection(input: {
    propertyId: string;
    assigneeUserId: string;
    scheduledFor: string;
    purpose: string;
  }) {
    return post<FieldVisit>('/admin/field-operations/visits', input);
  },
  checkIn(id: string, input: { lat: number; lng: number; accuracyM: number }) {
    return post<FieldVisit>(`/admin/field-operations/visits/${id}/check-in`, input);
  },
  complete(id: string, outcomeNote: string) {
    return post<FieldVisit>(`/admin/field-operations/visits/${id}/complete`, { outcomeNote });
  },
  reassign(id: string, assigneeUserId: string) {
    return post<FieldVisit>(`/admin/field-operations/visits/${id}/reassign`, { assigneeUserId });
  },
  cancel(id: string, reason: string) {
    return post<FieldVisit>(`/admin/field-operations/visits/${id}/cancel`, { reason });
  },
};

export type PnlGroupBy = 'property' | 'manager' | 'tier' | 'region';

export interface PnlFigures {
  revenue: number;
  partnerShare: number;
  directCosts: number;
  margin: number;
  marginPct: number | null;
}

export interface ManagedPnl {
  from: string;
  to: string;
  groupBy: PnlGroupBy;
  totals: PnlFigures & { engagements: number };
  rows: (PnlFigures & { key: string; label: string; detail: string | null; engagements: number })[];
  months: (PnlFigures & { period: string })[];
}

export type ManagedCostCategory =
  | 'FIELD_VISIT'
  | 'STAFF_TIME'
  | 'TRANSPORT'
  | 'LEGAL'
  | 'MARKETING'
  | 'VENDOR_OVERSIGHT'
  | 'OTHER';

export interface ManagedCost {
  id: string;
  mandateId: string;
  propertyId: string;
  propertyTitle: string;
  category: ManagedCostCategory;
  amount: number;
  incurredOn: string;
  note: string;
  visitId: string | null;
  voidedAt: string | null;
  voidReason: string | null;
}

export const adminManagedPnlService = {
  report(from: string, to: string, groupBy: PnlGroupBy): Promise<ApiResponse<ManagedPnl>> {
    return safeCall(() =>
      authFetch<ManagedPnl>(`/admin/managed-pnl?from=${from}&to=${to}&groupBy=${groupBy}`)
    );
  },
  costs(from: string, to: string): Promise<ApiResponse<ManagedCost[]>> {
    return safeCall(() =>
      authFetch<ManagedCost[]>(`/admin/managed-pnl/costs?from=${from}&to=${to}`)
    );
  },
  recordCost(input: {
    mandateId: string;
    category: ManagedCostCategory;
    amount: number;
    incurredOn: string;
    note: string;
  }) {
    return post<ManagedCost>('/admin/managed-pnl/costs', input);
  },
  voidCost(id: string, reason: string) {
    return post<{ id: string; voided: boolean }>(`/admin/managed-pnl/costs/${id}/void`, { reason });
  },
};

export type PmKpiScopeKind = PmKpiReport['scope']['kind'];

export const adminPmKpiService = {
  report(
    from: string,
    to: string,
    scope: PmKpiScopeKind,
    organizationId?: string
  ): Promise<ApiResponse<PmKpiReport>> {
    const firm = scope === 'FIRM' && organizationId ? `&organizationId=${organizationId}` : '';
    return safeCall(() =>
      authFetch<PmKpiReport>(`/admin/pm-kpis?from=${from}&to=${to}&scope=${scope}${firm}`)
    );
  },
  firms(): Promise<ApiResponse<{ id: string; name: string }[]>> {
    return safeCall(() => authFetch<{ id: string; name: string }[]>('/admin/pm-kpis/firms'));
  },
};

/* ── Fee changes (BD-2) ───────────────────────────────────────────────────────────────────────── */

export type ManagementFeeType = 'PERCENTAGE' | 'FLAT';
export type FeeAmendmentSide = 'OWNER' | 'MANAGER' | 'SUREGROUND';
export type FeeAmendmentStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN' | 'EXPIRED';

export interface FeeTerms {
  type: ManagementFeeType;
  value: number;
  label: string;
}

export interface FeeAmendment {
  id: string;
  mandateId: string;
  propertyId: string;
  propertyTitle: string | null;
  ownerName: string | null;
  managerName: string | null;
  managerIsSureground: boolean;
  proposedById: string;
  proposedByName: string | null;
  proposerSide: FeeAmendmentSide;
  from: FeeTerms;
  to: FeeTerms;
  reason: string;
  effectiveFrom: string;
  expiresAt: string;
  status: FeeAmendmentStatus;
  decidedById: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  createdAt: string;
  quorum: { ownersRequired: number; ownersAccepted: number; managerAccepted: boolean };
  permissions: { canAccept: boolean; canDecline: boolean; canWithdraw: boolean };
}

export interface FeeAmendmentOverview {
  mandateId: string;
  managerIsSureground: boolean;
  currentFee: FeeTerms | null;
  canPropose: boolean;
  proposeBlockedReason: string | null;
  earliestEffectiveFrom: string;
  maxPercentage: number;
  pending: FeeAmendment | null;
}

export interface ProposeFeeAmendmentInput {
  type: ManagementFeeType;
  value: number;
  reason: string;
  effectiveFrom: string;
}

export const adminFeeAmendmentService = {
  list(status?: FeeAmendmentStatus): Promise<ApiResponse<FeeAmendment[]>> {
    return safeCall(() =>
      authFetch<FeeAmendment[]>(
        `/admin/management-mandates/fee-amendments${status ? `?status=${status}` : ''}`
      )
    );
  },

  overview(mandateId: string): Promise<ApiResponse<FeeAmendmentOverview>> {
    return safeCall(() =>
      authFetch<FeeAmendmentOverview>(`/admin/management-mandates/${mandateId}/fee-amendments`)
    );
  },

  /** Managed agreements only; the API asks for step-up and `authFetch` handles it. */
  propose(mandateId: string, input: ProposeFeeAmendmentInput): Promise<ApiResponse<FeeAmendment>> {
    return post<FeeAmendment>(`/admin/management-mandates/${mandateId}/fee-amendments`, input);
  },

  withdraw(id: string): Promise<ApiResponse<FeeAmendment>> {
    return post<FeeAmendment>(`/admin/management-mandates/fee-amendments/${id}/withdraw`);
  },
};
