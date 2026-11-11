import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';
import type { DepositEndStage, DepositEndView } from '@/services/depositService';

export interface TenantDeduction {
  id: string;
  amount: number;
  reason: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  fromInspection: boolean;
  createdAt: string;
  decisionNote: string | null;
  disputedAt: string | null;
  disputeReason: string | null;
  disputeAnsweredAt: string | null;
  disputeAnswer: string | null;
  canDispute: boolean;
}

export interface TenantDeposit {
  leaseId: string;
  leaseStatus: string;
  /** Older API responses may leave it out. */
  leaseEnd?: string;
  propertyTitle: string;
  unitName: string;
  agreedAmount: number;
  paidThroughSureground: { amount: number; paid: boolean; paidDate: string | null } | null;
  hold: {
    id: string;
    amount: number;
    status: 'HELD' | 'PARTIALLY_RETURNED' | 'RETURNED';
    heldBySureground: boolean;
    heldBy: string | null;
    takenAt: string;
    returnedAt: string | null;
    returnedAmount: number | null;
    /** D-6 end-of-tenancy stage; older API responses may leave it out. */
    endStage?: DepositEndStage;
    moveOutAt?: string | null;
    claimBy?: string | null;
    summary: {
      held: number;
      approvedDeductions: number;
      proposedDeductions: number;
      returnable: number;
    };
    deductions: TenantDeduction[];
  } | null;
}

export function myDeposits(): Promise<ApiResponse<TenantDeposit[]>> {
  return safeCall(() => authFetch<TenantDeposit[]>('/renter/deposits'));
}

export function disputeDeduction(
  deductionId: string,
  reason: string
): Promise<ApiResponse<{ disputed: boolean }>> {
  return safeCall(() =>
    authFetch<{ disputed: boolean }>(`/renter/deposits/deductions/${deductionId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  );
}

/** Worked out by Sureground. */
export interface DepositPlan {
  leaseId: string;
  overview: string;
  steps: { kind: 'do' | 'keep' | 'dispute'; text: string }[];
  /** With the grounds and a drafted reason. */
  disputes: {
    deductionId: string;
    amount: string;
    reason: string;
    grounds: string[];
    draft: string;
  }[];
  source: 'ai' | 'heuristic';
}

export function depositPlans(): Promise<ApiResponse<{ plans: DepositPlan[]; disclaimer: string }>> {
  return safeCall(() => authFetch('/renter/deposits/plan'));
}

/** D-6 end of tenancy, tenant side. */
export function depositEndOfTenancy(holdId: string): Promise<ApiResponse<DepositEndView>> {
  return safeCall(() => authFetch<DepositEndView>(`/renter/deposits/${holdId}/end-of-tenancy`));
}

export function sayMovedOut(holdId: string): Promise<ApiResponse<DepositEndView>> {
  return safeCall(() =>
    authFetch<DepositEndView>(`/renter/deposits/${holdId}/moved-out`, { method: 'POST' })
  );
}

/** Needs step-up confirmation (handled by authFetch): money moves. */
export function acceptDepositClaim(holdId: string): Promise<ApiResponse<DepositEndView>> {
  return safeCall(() =>
    authFetch<DepositEndView>(`/renter/deposits/${holdId}/claim/accept`, { method: 'POST' })
  );
}

export function disputeDepositClaim(
  holdId: string,
  reason: string
): Promise<ApiResponse<DepositEndView>> {
  return safeCall(() =>
    authFetch<DepositEndView>(`/renter/deposits/${holdId}/claim/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  );
}
