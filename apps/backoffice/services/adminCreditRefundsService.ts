import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';

export type CreditRefundStatus = 'PROCESSING' | 'REFUNDED' | 'PARTLY_REFUNDED' | 'FAILED';

export interface CreditRefund {
  id: string;
  leaseId: string;
  // Naira.
  amount: number;
  refundedAmount: number;
  status: CreditRefundStatus;
  requestedAs: 'TENANT' | 'MANAGER' | 'ADMIN';
  reason: string | null;
  lastError: string | null;
  createdAt: string;
  settledAt: string | null;
  tenantName: string;
  tenantEmail: string | null;
  propertyName: string;
  unitName: string;
  lines: {
    amount: number;
    status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
    error: string | null;
    simulated: boolean;
    providerReference: string | null;
  }[];
}

export const adminCreditRefundsService = {
  list(status?: CreditRefundStatus): Promise<ApiResponse<CreditRefund[]>> {
    return safeCall(() =>
      authFetch<CreditRefund[]>(`/admin/credit-refunds${status ? `?status=${status}` : ''}`)
    );
  },
  refund(leaseId: string, reason: string): Promise<ApiResponse<CreditRefund>> {
    return safeCall(() =>
      authFetch<CreditRefund>(`/admin/leases/${leaseId}/credit-refund`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    );
  },
};
