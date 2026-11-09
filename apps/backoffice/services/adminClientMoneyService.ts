import { authFetch, safeCall, type ApiResponse } from '@sureground/shared';

// UNATTESTED means nobody counted the money that day; never render it as fine.

export type ReconciliationStatus = 'MATCHED' | 'DRIFT' | 'INTEGRITY_FAILED' | 'UNATTESTED';

export interface IntegrityFinding {
  accountId: string;
  ownerId: string;
  stored: number;
  // What its entries add up to; this is the truth.
  computed: number;
  difference: number;
}

export interface ReconciliationRow {
  id: string;
  /** Null is the Sureground platform pool. */
  organizationId: string | null;
  organizationName: string | null;
  currency: string;
  asOfDate: string;
  ledgerTotal: number;
  // Null means nobody told us, not zero.
  bankBalance: number | null;
  // Null exactly when bankBalance is.
  drift: number | null;
  status: ReconciliationStatus;
  integrityOk: boolean;
  integrityFindings: IntegrityFinding[];
  accountsChecked: number;
  ranAt: string;
  alertedAt: string | null;
}

export interface AttestationStatus {
  latestAsOfDate: string | null;
  // Null when nobody ever has.
  daysSince: number | null;
}

export interface ReconciliationOverview {
  rows: ReconciliationRow[];
  attestation: AttestationStatus;
}

export interface RecordBankBalanceInput {
  /** Null/omitted is the Sureground platform pool. */
  organizationId?: string | null;
  asOfDate: string;
  balance: number;
  source?: 'MANUAL' | 'PROVIDER_FEED';
  note?: string;
}

// Written out, not derived: "Bank agrees" and "Not checked" must never drift into looking alike.
export const STATUS_LABELS: Record<ReconciliationStatus, string> = {
  MATCHED: 'Bank agrees',
  DRIFT: 'Drift',
  INTEGRITY_FAILED: 'Our records disagree',
  UNATTESTED: 'Not checked',
};

export const STATUS_VARIANT: Record<
  ReconciliationStatus,
  'success' | 'warning' | 'danger' | 'neutral'
> = {
  MATCHED: 'success',
  DRIFT: 'danger',
  INTEGRITY_FAILED: 'danger',
  // Neutral, NOT success: nobody counted the money.
  UNATTESTED: 'neutral',
};

export function driftDirection(drift: number): 'SURPLUS' | 'SHORTFALL' {
  return drift > 0 ? 'SURPLUS' : 'SHORTFALL';
}

export function driftSentence(row: ReconciliationRow): string {
  if (row.status === 'UNATTESTED') {
    return 'No bank balance recorded for this date, so the pool could not be checked.';
  }
  if (row.status === 'INTEGRITY_FAILED') {
    return 'An account holds a balance its own entries do not explain. The bank figure cannot be trusted until this is fixed.';
  }
  if (row.drift === null) return '—';
  if (row.drift === 0) return 'The bank holds exactly what owners are owed.';
  return driftDirection(row.drift) === 'SHORTFALL'
    ? 'The bank holds less than owners are owed.'
    : 'The bank holds more than owners are owed.';
}

// thresholdAtRequest is the threshold when raised; a later policy change must not rewrite why this needed approving.
export interface ReleaseRequestRow {
  id: string;
  statementId: string;
  amount: number;
  requestedById: string;
  requestedByName: string | null;
  reason: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decidedById: string | null;
  decidedByName: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  transferRef: string | null;
  thresholdAtRequest: number;
  createdAt: string;
  // Answered by the server: AdminUser has no id, and requestedByName is a display name.
  requestedByMe: boolean;
  ownerId: string;
  ownerName: string | null;
  organizationId: string | null;
  organizationName: string | null;
  periodStart: string;
  periodEnd: string;
}

// The statement figure never changes: an upheld query is corrected by a ledger adjustment on the next statement.
export interface StatementLineDisputeRow {
  id: string;
  statementId: string;
  lineId: string;
  lineLabel: string;
  lineAmount: number;
  reason: string;
  status: 'OPEN' | 'UPHELD' | 'REJECTED' | 'WITHDRAWN';
  raisedById: string;
  raisedByName: string | null;
  raisedByMe: boolean;
  firmResponse: string | null;
  firmRespondedByName: string | null;
  firmRespondedAt: string | null;
  resolvedByName: string | null;
  resolvedAt: string | null;
  outcomeNote: string | null;
  adjustmentEntryId: string | null;
  createdAt: string;
  moneyEffect: 'HELD' | 'IN_FLIGHT' | 'PAID' | 'NONE';
}

export const adminClientMoneyService = {
  async overview(limit = 50): Promise<ApiResponse<ReconciliationOverview>> {
    return safeCall(() =>
      authFetch<ReconciliationOverview>(`/admin/client-money/reconciliation?limit=${limit}`)
    );
  },

  async forDate(date: string): Promise<ApiResponse<ReconciliationRow[]>> {
    return safeCall(() =>
      authFetch<ReconciliationRow[]>(`/admin/client-money/reconciliation/${date}`)
    );
  },

  // Does not run the reconciliation: attesting a balance and judging the pool stay separate acts.
  async recordBankBalance(
    input: RecordBankBalanceInput
  ): Promise<ApiResponse<{ id: string; asOfDate: string; balance: number }>> {
    return safeCall(() =>
      authFetch<{ id: string; asOfDate: string; balance: number }>(
        '/admin/client-money/bank-balances',
        { method: 'POST', body: JSON.stringify(input) }
      )
    );
  },

  async run(asOfDate?: string): Promise<ApiResponse<unknown>> {
    return safeCall(() =>
      authFetch('/admin/client-money/reconciliation/run', {
        method: 'POST',
        body: JSON.stringify(asOfDate ? { asOfDate } : {}),
      })
    );
  },
  // Ordered by the API, oldest first: that is the owner waiting longest.
  async pendingReleases(): Promise<ApiResponse<ReleaseRequestRow[]>> {
    return safeCall(() => authFetch<ReleaseRequestRow[]>('/admin/client-money/releases'));
  },

  // The note is required: a checker who records nothing is a rubber stamp.
  async approveRelease(id: string, note: string): Promise<ApiResponse<ReleaseRequestRow>> {
    return safeCall(() =>
      authFetch<ReleaseRequestRow>(`/admin/client-money/releases/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      })
    );
  },

  // The statement is issued either way; the debt stands.
  async rejectRelease(id: string, note: string): Promise<ApiResponse<ReleaseRequestRow>> {
    return safeCall(() =>
      authFetch<ReleaseRequestRow>(`/admin/client-money/releases/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      })
    );
  },

  // Read moneyEffect first: only a HELD payout can still be stopped.
  async pendingDisputes(): Promise<ApiResponse<StatementLineDisputeRow[]>> {
    return safeCall(() => authFetch<StatementLineDisputeRow[]>('/admin/client-money/disputes'));
  },

  // Upholding adds an ADJUSTMENT entry to the next statement (the statement is never edited); rejecting lets a held payout proceed.
  async resolveDispute(
    id: string,
    outcome: 'UPHELD' | 'REJECTED',
    note: string
  ): Promise<ApiResponse<StatementLineDisputeRow>> {
    return safeCall(() =>
      authFetch<StatementLineDisputeRow>(`/admin/client-money/disputes/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ outcome, note }),
      })
    );
  },
};
