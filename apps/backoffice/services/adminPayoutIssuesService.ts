import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';

export type PayoutRail = 'shortlet' | 'realtor' | 'agency' | 'agent' | 'partner' | 'sale';

// Only the last four digits are sent. accountChanged is null when the first attempt is unknown.
export interface PayoutDestination {
  bankName: string | null;
  accountLast4: string | null;
  accountName: string | null;
  accountChanged: boolean | null;
}

// Amounts are whole naira.
export interface PayoutIssue {
  rail: PayoutRail;
  id: string;
  amount: number;
  beneficiary: string;
  failureReason: string | null;
  createdAt: string;
  held?: {
    code: string;
    message: string;
    needsApproval: boolean;
    approved?: boolean;
  };
  transferRef?: string | null;
  destination?: PayoutDestination | null;
  source?: PayoutSource | null;
}

export type PayoutSourceKind =
  | 'booking'
  | 'realtorCommission'
  | 'agencyCommission'
  | 'partnerCommission';

export interface PayoutSource {
  kind: PayoutSourceKind;
  id: string;
  count: number;
}

export type PayoutKind = PayoutRail | 'statement' | 'disbursement' | 'vendor' | 'land';

export interface WaitingPayout {
  kind: PayoutKind;
  id: string;
  amount: number;
  beneficiary: string;
  reference: string;
  since: string;
}

export interface PayoutIssues {
  failed: PayoutIssue[];
  stuck: PayoutIssue[];
  waiting: WaitingPayout[];
}

export const adminPayoutIssuesService = {
  list(): Promise<ApiResponse<PayoutIssues>> {
    return safeCall(() => authFetch<PayoutIssues>('/admin/payout-retries'));
  },
  // Payouts of ₦5m or more need a second officer's approval before Retry sends them.
  approve(
    reference: string,
    note?: string
  ): Promise<ApiResponse<{ subject: string; amount: number }>> {
    return safeCall(() =>
      authFetch<{ subject: string; amount: number }>('/admin/payout-approvals', {
        method: 'POST',
        body: JSON.stringify({ reference, ...(note ? { note } : {}) }),
      })
    );
  },
  retry(rail: PayoutRail, id: string): Promise<ApiResponse<{ id: string; status: string }>> {
    return safeCall(() =>
      authFetch<{ id: string; status: string }>(`/admin/payout-retries/${rail}/${id}`, {
        method: 'POST',
      })
    );
  },
};
