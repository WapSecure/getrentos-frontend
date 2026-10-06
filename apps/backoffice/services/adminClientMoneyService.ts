import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

/**
 * Client money — the officer's side.
 *
 * The ledger says how much of a pooled account belongs to each owner. This is the
 * surface for the two things that keep that claim honest: recording what the bank
 * actually holds, and reading the daily verdict on whether the two agree.
 *
 * The status vocabulary is deliberately not binary. `UNATTESTED` is not a
 * synonym for "fine" — it means nobody counted the money that day, and a screen
 * that renders it as a green tick is worse than one that shows nothing.
 */

export type ReconciliationStatus = 'MATCHED' | 'DRIFT' | 'INTEGRITY_FAILED' | 'UNATTESTED';

/** An account whose stored balance did not equal the sum of its own entries. */
export interface IntegrityFinding {
  accountId: string;
  ownerId: string;
  /** What the account row claims the owner is owed. */
  stored: number;
  /** What its entries add up to. This is the truth. */
  computed: number;
  difference: number;
}

export interface ReconciliationRow {
  id: string;
  /** Null is the GetRentos platform pool. */
  organizationId: string | null;
  organizationName: string | null;
  currency: string;
  asOfDate: string;
  /** Sum of every owner's balance for this holder. */
  ledgerTotal: number;
  /** What the bank said. Null means nobody told us — not zero. */
  bankBalance: number | null;
  /** `bankBalance - ledgerTotal`. Null exactly when `bankBalance` is. */
  drift: number | null;
  status: ReconciliationStatus;
  integrityOk: boolean;
  integrityFindings: IntegrityFinding[];
  accountsChecked: number;
  ranAt: string;
  /** When this condition was alerted on, if it ever was. */
  alertedAt: string | null;
}

export interface AttestationStatus {
  latestAsOfDate: string | null;
  /** Days since anybody counted the money. Null when nobody ever has. */
  daysSince: number | null;
}

export interface ReconciliationOverview {
  rows: ReconciliationRow[];
  attestation: AttestationStatus;
}

export interface RecordBankBalanceInput {
  /** Null/omitted is the GetRentos platform pool. */
  organizationId?: string | null;
  asOfDate: string;
  balance: number;
  source?: 'MANUAL' | 'PROVIDER_FEED';
  note?: string;
}

/**
 * The status vocabulary, in words somebody can act on.
 *
 * Written here rather than derived from the status string in the component,
 * because the words ARE the meaning: "Bank agrees" and "Not checked" must not be
 * able to drift into looking alike, which is what gave this file its reason to
 * exist.
 */
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

/** Which way the pool is out. Two different incidents, two different remedies. */
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

  /**
   * Record what the bank holds. Does not run the reconciliation — attesting a
   * balance and judging the pool are separate acts, so the verdict never depends
   * on who happened to be typing.
   */
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
};
