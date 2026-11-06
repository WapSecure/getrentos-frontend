import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

export type PayoutRail = 'shortlet' | 'realtor' | 'agency' | 'agent' | 'partner' | 'sale';

/** One payout that needs a person. Amounts are whole naira. */
export interface PayoutIssue {
  rail: PayoutRail;
  id: string;
  amount: number;
  beneficiary: string;
  failureReason: string | null;
  createdAt: string;
}

export interface PayoutIssues {
  /** Refused or reversed by the bank: can be retried. */
  failed: PayoutIssue[];
  /** Stopped before a transfer reference was saved: no money was sent. */
  stuck: PayoutIssue[];
}

export const adminPayoutIssuesService = {
  list(): Promise<ApiResponse<PayoutIssues>> {
    return safeCall(() => authFetch<PayoutIssues>('/admin/payout-retries'));
  },
  /** Needs step-up; the shared dialog asks for it. */
  retry(rail: PayoutRail, id: string): Promise<ApiResponse<{ id: string; status: string }>> {
    return safeCall(() =>
      authFetch<{ id: string; status: string }>(`/admin/payout-retries/${rail}/${id}`, {
        method: 'POST',
      })
    );
  },
};
