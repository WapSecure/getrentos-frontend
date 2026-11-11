import { authFetch, safeCall, toQuery, type ApiResponse, type Paginated } from '@/lib/apiHelpers';

/** Mirrors the backend's `DepositHoldStatus`. */
export const DEPOSIT_STATUSES = ['HELD', 'PARTIALLY_RETURNED', 'RETURNED'] as const;
export type DepositStatus = (typeof DEPOSIT_STATUSES)[number];

export const DEPOSIT_STATUS_LABELS: Record<DepositStatus, string> = {
  HELD: 'Held',
  PARTIALLY_RETURNED: 'Partially returned',
  RETURNED: 'Returned',
};

/** Mirrors the backend's `DepositDeductionStatus`. */
export type DeductionStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED';

export const DEDUCTION_STATUS_LABELS: Record<DeductionStatus, string> = {
  PROPOSED: 'Awaiting owner',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export interface DepositDeduction {
  id: string;
  amount: number;
  reason: string;
  status: DeductionStatus;
  inspectionId: string | null;
  proposedById: string;
  decidedById: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  tenantDisputedAt: string | null;
  tenantDisputeReason: string | null;
  disputeAnsweredAt: string | null;
  disputeAnswer: string | null;
  createdAt: string;
}

export interface DepositSummary {
  held: number;
  approvedDeductions: number;
  proposedDeductions: number;
  returnable: number;
}

export interface DepositHoldListItem {
  id: string;
  leaseId: string;
  propertyId: string;
  propertyTitle: string | null;
  amount: number;
  status: DepositStatus;
  heldBySureground: boolean;
  returnable: number;
  createdAt: string;
  /** D-6 end-of-tenancy stage; older API responses may leave it out. */
  endStage?: DepositEndStage;
  moveOutAt?: string | null;
  claimBy?: string | null;
}

export interface DepositHold extends DepositHoldListItem {
  mandateId: string | null;
  takenAt: string;
  returnedAt: string | null;
  returnedAmount: number | null;
  deductions: DepositDeduction[];
  summary: DepositSummary;
}

export interface CreateDepositHoldInput {
  leaseId: string;
  amount?: number;
  heldBySureground?: boolean;
}

export interface ProposeDeductionInput {
  amount: number;
  reason: string;
  inspectionId?: string;
}

export interface ListDepositsParams {
  propertyId?: string;
  status?: DepositStatus;
  page?: number;
  pageSize?: number;
}

export const depositService = {
  list(params: ListDepositsParams = {}): Promise<ApiResponse<Paginated<DepositHoldListItem>>> {
    return safeCall(() =>
      authFetch<Paginated<DepositHoldListItem>>(
        `/deposits${toQuery(params as Record<string, string | number | boolean | undefined>)}`
      )
    );
  },

  get(id: string): Promise<ApiResponse<DepositHold>> {
    return safeCall(() => authFetch<DepositHold>(`/deposits/${id}`));
  },

  getByLease(leaseId: string): Promise<ApiResponse<DepositHold | null>> {
    return safeCall(() => authFetch<DepositHold | null>(`/deposits/by-lease/${leaseId}`));
  },

  create(data: CreateDepositHoldInput): Promise<ApiResponse<DepositHold>> {
    return safeCall(() =>
      authFetch<DepositHold>('/deposits', { method: 'POST', body: JSON.stringify(data) })
    );
  },

  proposeDeduction(id: string, data: ProposeDeductionInput): Promise<ApiResponse<DepositHold>> {
    return safeCall(() =>
      authFetch<DepositHold>(`/deposits/${id}/deductions`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
    );
  },

  approveDeduction(
    id: string,
    deductionId: string,
    note?: string
  ): Promise<ApiResponse<DepositHold>> {
    return safeCall(() =>
      authFetch<DepositHold>(`/deposits/${id}/deductions/${deductionId}/approve`, {
        method: 'POST',
        body: JSON.stringify(note ? { note } : {}),
      })
    );
  },

  answerDispute(
    id: string,
    deductionId: string,
    input: { answer: string; withdraw: boolean }
  ): Promise<ApiResponse<DepositHold>> {
    return safeCall(() =>
      authFetch<DepositHold>(`/deposits/${id}/deductions/${deductionId}/answer-dispute`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },

  rejectDeduction(
    id: string,
    deductionId: string,
    reason: string
  ): Promise<ApiResponse<DepositHold>> {
    return safeCall(() =>
      authFetch<DepositHold>(`/deposits/${id}/deductions/${deductionId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },

  returnDeposit(id: string): Promise<ApiResponse<DepositHold>> {
    return safeCall(() => authFetch<DepositHold>(`/deposits/${id}/return`, { method: 'POST' }));
  },

  endOfTenancy(id: string): Promise<ApiResponse<DepositEndView>> {
    return safeCall(() => authFetch<DepositEndView>(`/deposits/${id}/end-of-tenancy`));
  },

  recordMoveOut(id: string, moveOutAt?: string): Promise<ApiResponse<DepositEndView>> {
    return safeCall(() =>
      authFetch<DepositEndView>(`/deposits/${id}/move-out`, {
        method: 'POST',
        body: JSON.stringify(moveOutAt ? { moveOutAt } : {}),
      })
    );
  },

  uploadClaimEvidence(id: string, file: File): Promise<ApiResponse<{ key: string }>> {
    const form = new FormData();
    form.append('file', file);
    return safeCall(() =>
      authFetch<{ key: string }>(`/deposits/${id}/claim-evidence`, { method: 'POST', body: form })
    );
  },

  fileClaim(id: string, items: DepositClaimItemInput[]): Promise<ApiResponse<DepositEndView>> {
    return safeCall(() =>
      authFetch<DepositEndView>(`/deposits/${id}/claim`, {
        method: 'POST',
        body: JSON.stringify({ items }),
      })
    );
  },
};

/** Mirrors the backend's `DepositEndStage` (D-6). */
export type DepositEndStage =
  | 'TENANCY'
  | 'AWAITING_CLAIM'
  | 'AWAITING_TENANT'
  | 'IN_MEDIATION'
  | 'SETTLED';

export const DEPOSIT_END_STAGE_LABELS: Record<DepositEndStage, string> = {
  TENANCY: 'Tenancy running',
  AWAITING_CLAIM: 'Claim window open',
  AWAITING_TENANT: 'Waiting for the tenant',
  IN_MEDIATION: 'With Sureground to decide',
  SETTLED: 'Settled',
};

export type DepositRefundStatus = 'NOT_NEEDED' | 'REFUNDED' | 'CONFIRMING' | 'NEEDS_FINANCE';

export const DEPOSIT_REFUND_STATUS_LABELS: Record<DepositRefundStatus, string> = {
  NOT_NEEDED: 'Nothing to refund',
  REFUNDED: 'Refund sent',
  CONFIRMING: 'Refund being confirmed',
  NEEDS_FINANCE: 'Refund with finance',
};

export interface DepositEvidenceFile {
  name: string;
  mimeType: string | null;
  url: string;
}

export interface DepositClaimItem {
  id: string;
  reason: string;
  amount: number;
  inspectionId: string | null;
  evidence: DepositEvidenceFile[];
}

export interface DepositClaim {
  id: string;
  amount: number;
  status: 'AWAITING_TENANT' | 'ACCEPTED' | 'DISPUTED' | 'DECIDED';
  respondBy: string;
  respondedAt: string | null;
  acceptedByDefault: boolean;
  disputeReason: string | null;
  decidedAmount: number | null;
  decidedAt: string | null;
  resolution: string | null;
  createdAt: string;
  items: DepositClaimItem[];
}

/** The deposit in the D-6 end-of-tenancy flow, as landlord, tenant and Sureground staff see it. */
export interface DepositEndView {
  holdId: string;
  leaseId: string;
  propertyTitle: string | null;
  unitName: string | null;
  tenantName: string | null;
  amount: number;
  heldBySureground: boolean;
  /** Received through Sureground: only this can be claimed or refunded. */
  funded: number;
  endStage: DepositEndStage;
  moveOutAt: string | null;
  claimBy: string | null;
  claim: DepositClaim | null;
  settlement: {
    landlordAmount: number;
    refundAmount: number;
    refundStatus: DepositRefundStatus | null;
    settledHow: 'NO_CLAIM' | 'TENANT_ACCEPTED' | 'NO_RESPONSE' | 'MEDIATION' | null;
    settledAt: string | null;
  } | null;
}

export interface DepositClaimItemInput {
  reason: string;
  amount: number;
  evidenceKeys?: string[];
  inspectionId?: string;
}

export const SETTLED_HOW_TEXT: Record<
  NonNullable<NonNullable<DepositEndView['settlement']>['settledHow']>,
  string
> = {
  NO_CLAIM: 'No deductions were claimed within 14 days of move-out.',
  TENANT_ACCEPTED: 'The tenant accepted the claim.',
  NO_RESPONSE: 'The tenant did not respond within 7 days, so the claim counts as accepted.',
  MEDIATION: 'Sureground decided the dispute.',
};
