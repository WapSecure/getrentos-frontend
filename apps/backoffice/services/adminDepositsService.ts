import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';

/** Mirrors the backend's `DepositEndStage` (D-6). */
export type DepositEndStage =
  | 'TENANCY'
  | 'AWAITING_CLAIM'
  | 'AWAITING_TENANT'
  | 'IN_MEDIATION'
  | 'SETTLED';

export type DepositRefundStatus = 'NOT_NEEDED' | 'REFUNDED' | 'CONFIRMING' | 'NEEDS_FINANCE';

export type AdminDepositView =
  | 'IN_MEDIATION'
  | 'AWAITING_TENANT'
  | 'AWAITING_CLAIM'
  | 'SETTLED'
  | 'NEEDS_FINANCE';

export interface AdminDeposit {
  holdId: string;
  leaseId: string;
  propertyTitle: string | null;
  unitName: string | null;
  tenantName: string | null;
  // Naira.
  amount: number;
  heldBySureground: boolean;
  funded: number;
  endStage: DepositEndStage;
  moveOutAt: string | null;
  claimBy: string | null;
  claim: {
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
    items: {
      id: string;
      reason: string;
      amount: number;
      inspectionId: string | null;
      evidence: { name: string; mimeType: string | null; url: string }[];
    }[];
  } | null;
  settlement: {
    landlordAmount: number;
    refundAmount: number;
    refundStatus: DepositRefundStatus | null;
    settledHow: string | null;
    settledAt: string | null;
  } | null;
}

export interface OverCapRow {
  leaseId: string;
  leaseStatus: string;
  propertyTitle: string;
  unitName: string;
  tenantName: string | null;
  rentAmount: number;
  rentPeriod: 'MONTHLY' | 'ANNUAL';
  cap: number;
  leaseDeposit: number | null;
  heldAmount: number | null;
  charged: number;
  heldBySureground: boolean | null;
}

export const adminDepositsService = {
  list(view: AdminDepositView = 'IN_MEDIATION'): Promise<ApiResponse<AdminDeposit[]>> {
    return safeCall(() => authFetch<AdminDeposit[]>(`/admin/deposits?view=${view}`));
  },
  /** Needs disputes.resolve and a step-up confirmation. */
  decide(
    holdId: string,
    input: { landlordAmount: number; resolution: string }
  ): Promise<ApiResponse<AdminDeposit>> {
    return safeCall(() =>
      authFetch<AdminDeposit>(`/admin/deposits/${holdId}/decide`, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    );
  },
  /** Needs rentfinance.approve and a step-up confirmation. */
  retryRefund(holdId: string): Promise<ApiResponse<AdminDeposit>> {
    return safeCall(() =>
      authFetch<AdminDeposit>(`/admin/deposits/${holdId}/retry-refund`, { method: 'POST' })
    );
  },
  overCap(): Promise<ApiResponse<{ rows: OverCapRow[]; scanned: number; truncated: boolean }>> {
    return safeCall(() => authFetch(`/admin/deposits/over-cap`));
  },
};
