import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

export type PayoutRail = 'shortlet' | 'realtor' | 'agency' | 'agent' | 'partner' | 'sale';

/**
 * Where a payout goes: the holder's current account. Only the last four digits
 * of the number are ever sent. `accountChanged` is true when that is not the
 * account the payout was first sent to, null when the first attempt is unknown.
 */
export interface PayoutDestination {
  bankName: string | null;
  accountLast4: string | null;
  accountName: string | null;
  accountChanged: boolean | null;
}

/** One payout that needs a person. Amounts are whole naira. */
export interface PayoutIssue {
  rail: PayoutRail;
  id: string;
  amount: number;
  beneficiary: string;
  failureReason: string | null;
  createdAt: string;
  /** A payout limit stopped it before anything was sent; approval releases NEEDS_APPROVAL ones. */
  held?: { code: string; message: string; needsApproval: boolean };
  /** The reference it was last tried under. */
  transferRef?: string | null;
  /** Where a retry would send it; null when the holder has no payout account. */
  destination?: PayoutDestination | null;
}

/** Every way money leaves, including those retried elsewhere. */
export type PayoutKind = PayoutRail | 'statement' | 'disbursement' | 'vendor' | 'land';

/** Sent to the bank more than a day ago and not settled yet. */
export interface WaitingPayout {
  kind: PayoutKind;
  id: string;
  amount: number;
  beneficiary: string;
  reference: string;
  since: string;
}

export interface PayoutIssues {
  /** Refused or reversed by the bank: can be retried. */
  failed: PayoutIssue[];
  /** Stopped before a transfer reference was saved: no money was sent. */
  stuck: PayoutIssue[];
  /** Sent more than a day ago, still unsettled: check it with Paystack before doing anything. */
  waiting: WaitingPayout[];
}

export const adminPayoutIssuesService = {
  list(): Promise<ApiResponse<PayoutIssues>> {
    return safeCall(() => authFetch<PayoutIssues>('/admin/payout-retries'));
  },
  /** A second officer approves a held payout of ₦5m or more; then Retry sends it. Needs step-up. */
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
  /** Needs step-up; the shared dialog asks for it. */
  retry(rail: PayoutRail, id: string): Promise<ApiResponse<{ id: string; status: string }>> {
    return safeCall(() =>
      authFetch<{ id: string; status: string }>(`/admin/payout-retries/${rail}/${id}`, {
        method: 'POST',
      })
    );
  },
};
