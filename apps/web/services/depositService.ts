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
  heldByGetRentos: boolean;
  returnable: number;
  createdAt: string;
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
  heldByGetRentos?: boolean;
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

  approveDeduction(id: string, deductionId: string): Promise<ApiResponse<DepositHold>> {
    return safeCall(() =>
      authFetch<DepositHold>(`/deposits/${id}/deductions/${deductionId}/approve`, {
        method: 'POST',
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
};
