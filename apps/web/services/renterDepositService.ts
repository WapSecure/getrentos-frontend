import { authFetch, safeCall, type ApiResponse } from '@/lib/apiHelpers';

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
  propertyTitle: string;
  unitName: string;
  agreedAmount: number;
  paidThroughGetRentos: { amount: number; paid: boolean; paidDate: string | null } | null;
  hold: {
    id: string;
    amount: number;
    status: 'HELD' | 'PARTIALLY_RETURNED' | 'RETURNED';
    heldByGetRentos: boolean;
    heldBy: string | null;
    takenAt: string;
    returnedAt: string | null;
    returnedAmount: number | null;
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
