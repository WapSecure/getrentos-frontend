import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

export type ManagedServicingTier = 'COLLECT_ONLY' | 'COLLECT_MAINTAIN' | 'FULL_MANAGEMENT';

/** The subset of a management mandate the ops activation queue needs. */
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
}

/** A vetted firm a managed engagement can be handed to for local delivery. */
export interface PartnerFirm {
  id: string;
  name: string;
}

export const adminManagedService = {
  /** GetRentos Managed opt-ins awaiting a portfolio manager and activation. */
  listPending(): Promise<ApiResponse<ManagedMandate[]>> {
    return safeCall(() =>
      authFetch<ManagedMandate[]>('/admin/management-mandates/managed-pending')
    );
  },

  /** Live GetRentos Managed engagements — the surface for reassigning a manager. */
  listActive(): Promise<ApiResponse<ManagedMandate[]>> {
    return safeCall(() => authFetch<ManagedMandate[]>('/admin/management-mandates/managed-active'));
  },

  /** Vetted firms ops can designate as a delivery partner. */
  listPartnerFirms(): Promise<ApiResponse<PartnerFirm[]>> {
    return safeCall(() => authFetch<PartnerFirm[]>('/admin/management-mandates/partner-firms'));
  },

  /** Assign the portfolio manager (and optionally a delivery partner) and turn the engagement on. */
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

  /** Assign one manager (and optional delivery partner) to several opt-ins at once. */
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

  /** Refuse several opt-ins in one pass, under one shared reason. */
  rejectBulk(mandateIds: string[], reason: string): Promise<ApiResponse<BulkRejectResult>> {
    return safeCall(() =>
      authFetch<BulkRejectResult>('/admin/management-mandates/reject-managed-bulk', {
        method: 'POST',
        body: JSON.stringify({ mandateIds, reason }),
      })
    );
  },

  /** Move several live engagements to the same new portfolio manager. */
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

  /** Pause several live engagements in one pass, under one shared reason. */
  suspendBulk(mandateIds: string[], reason: string): Promise<ApiResponse<BulkSuspendResult>> {
    return safeCall(() =>
      authFetch<BulkSuspendResult>('/admin/management-mandates/suspend-managed-bulk', {
        method: 'POST',
        body: JSON.stringify({ mandateIds, reason }),
      })
    );
  },

  /** Resume several paused engagements in one pass. */
  resumeBulk(mandateIds: string[]): Promise<ApiResponse<BulkResumeResult>> {
    return safeCall(() =>
      authFetch<BulkResumeResult>('/admin/management-mandates/resume-managed-bulk', {
        method: 'POST',
        body: JSON.stringify({ mandateIds }),
      })
    );
  },

  /** Raise a termination request against several engagements, under one shared reason. */
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

  /** Termination requests awaiting a second staff approver. */
  listTerminationRequests(): Promise<ApiResponse<TerminationRequest[]>> {
    return safeCall(() =>
      authFetch<TerminationRequest[]>('/admin/management-mandates/termination-requests')
    );
  },

  /** Approve several open termination requests — the checker half. */
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

/** An open ask to end an engagement, awaiting a second staff approver. */
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
  managerIsGetRentos: boolean;
  ownerName: string | null;
  noticePeriodDays: number;
  noticeServedAt: string | null;
}

/** The outcome of a bulk activation: a partial-success summary. */
export interface BulkActivateResult {
  requested: number;
  activated: number;
  skipped: { id: string; reason: string }[];
}

/** The outcome of a bulk rejection: a partial-success summary. */
export interface BulkRejectResult {
  requested: number;
  rejected: number;
  skipped: { id: string; reason: string }[];
}

/** The outcome of a bulk reassignment: a partial-success summary. */
export interface BulkReassignResult {
  requested: number;
  reassigned: number;
  skipped: { id: string; reason: string }[];
}

/** The outcome of a bulk suspend: a partial-success summary. */
export interface BulkSuspendResult {
  requested: number;
  suspended: number;
  skipped: { id: string; reason: string }[];
}

/** The outcome of a bulk resume: a partial-success summary. */
export interface BulkResumeResult {
  requested: number;
  resumed: number;
  skipped: { id: string; reason: string }[];
}

/** The outcome of a bulk termination request: a partial-success summary. */
export interface BulkRequestTerminationResult {
  requested: number;
  raised: number;
  skipped: { id: string; reason: string }[];
}

/** The outcome of a bulk termination approval: a partial-success summary. */
export interface BulkApproveTerminationResult {
  requested: number;
  approved: number;
  skipped: { id: string; reason: string }[];
}
