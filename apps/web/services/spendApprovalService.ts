import { authFetch, safeCall, toQuery, type ApiResponse, type Paginated } from '@/lib/apiHelpers';

export const SPEND_APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;
export type SpendApprovalStatus = (typeof SPEND_APPROVAL_STATUSES)[number];

export const SPEND_APPROVAL_STATUS_LABELS: Record<SpendApprovalStatus, string> = {
  PENDING: 'Awaiting you',
  APPROVED: 'Approved',
  REJECTED: 'Declined',
  CANCELLED: 'Cancelled',
};

export interface SpendApproval {
  id: string;
  propertyId: string;
  propertyTitle: string | null;
  mandateId: string | null;
  ownerId: string;
  requestedById: string;
  requestedByName: string | null;
  category: string;
  amount: number;
  incurredAt: string;
  note: string | null;
  status: SpendApprovalStatus;
  decisionNote: string | null;
  decidedAt: string | null;
  expenseId: string | null;
  createdAt: string;
}

export interface ListSpendApprovalsParams {
  role?: 'owner' | 'requester';
  status?: SpendApprovalStatus;
  page?: number;
  pageSize?: number;
}

export const spendApprovalService = {
  list(params: ListSpendApprovalsParams = {}): Promise<ApiResponse<Paginated<SpendApproval>>> {
    return safeCall(() =>
      authFetch<Paginated<SpendApproval>>(
        `/landlord/spend-approvals${toQuery(params as Record<string, string | number | boolean | undefined>)}`
      )
    );
  },

  approve(id: string): Promise<ApiResponse<SpendApproval>> {
    return safeCall(() =>
      authFetch<SpendApproval>(`/landlord/spend-approvals/${id}/approve`, { method: 'POST' })
    );
  },

  reject(id: string, reason: string): Promise<ApiResponse<SpendApproval>> {
    return safeCall(() =>
      authFetch<SpendApproval>(`/landlord/spend-approvals/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },

  setMandateCap(mandateId: string, cap: number | null): Promise<ApiResponse<void>> {
    return safeCall(() =>
      authFetch<void>(`/landlord/spend-approvals/mandate/${mandateId}/cap`, {
        method: 'PUT',
        body: JSON.stringify({ cap }),
      })
    );
  },
};
