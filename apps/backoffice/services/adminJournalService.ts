import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

export type JournalAccount =
  | 'CASH_CLEARING'
  | 'TENANT_RECEIVABLE'
  | 'DEFERRED_RENT'
  | 'OWNER_FUNDS_HELD'
  | 'OWNER_FUNDS_RELEASED'
  | 'TENANT_CREDIT'
  | 'OWNER_DEDUCTIONS';

export interface TrialBalance {
  accounts: { account: JournalAccount; debit: number; credit: number; balance: number }[];
  debit: number;
  credit: number;
  balanced: boolean;
}

export interface JournalCheck {
  id: string;
  ranAt: string;
  entriesPosted: number;
  leasesChecked: number;
  balanced: boolean;
  mismatches: {
    leaseId: string;
    account: JournalAccount;
    journal: number;
    expected: number;
    note?: string;
  }[];
}

export interface JournalEntryRow {
  id: string;
  kind: string;
  sourceType: string;
  sourceId: string;
  occurredAt: string;
  memo: string | null;
  lines: { account: JournalAccount; debit: number; credit: number }[];
}

export interface JournalMonth {
  period: string;
  status: 'OPEN' | 'CLOSED';
  entries: number;
  gatewayEntries: number;
  reconciliation: { id: string; status: 'OPEN' | 'RESOLVED'; openItems: number } | null;
  closedAt: string | null;
  note: string | null;
}

export type ReconciliationItemKind =
  | 'MATCHED'
  | 'AMOUNT_MISMATCH'
  | 'MISSING_IN_BOOKS'
  | 'MISSING_AT_GATEWAY';

export interface Reconciliation {
  id: string;
  period: string;
  source: 'CSV' | 'API';
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
  totals: {
    gatewayIn: number;
    booksIn: number;
    gatewayOut: number;
    booksOut: number;
    skipped?: number;
    errors?: string[];
  };
  items?: {
    id: string;
    kind: ReconciliationItemKind;
    direction: 'IN' | 'OUT';
    reference: string;
    gatewayAmount: number | null;
    bookAmount: number | null;
    resolution: string | null;
    resolvedAt: string | null;
  }[];
  _count?: { items: number };
}

export const adminJournalService = {
  months: (): Promise<ApiResponse<JournalMonth[]>> =>
    safeCall(() => authFetch<JournalMonth[]>('/admin/journal/periods')),
  closeMonth: (period: string, override?: string): Promise<ApiResponse<unknown>> =>
    safeCall(() =>
      authFetch(`/admin/journal/periods/${period}/close`, {
        method: 'POST',
        body: JSON.stringify(override ? { override } : {}),
      })
    ),
  reconciliations: (): Promise<ApiResponse<Reconciliation[]>> =>
    safeCall(() => authFetch<Reconciliation[]>('/admin/journal/reconciliations')),
  reconciliation: (id: string): Promise<ApiResponse<Reconciliation>> =>
    safeCall(() => authFetch<Reconciliation>(`/admin/journal/reconciliations/${id}`)),
  reconcileCsv: (period: string, csv: string): Promise<ApiResponse<Reconciliation>> =>
    safeCall(() =>
      authFetch<Reconciliation>('/admin/journal/reconciliations/csv', {
        method: 'POST',
        body: JSON.stringify({ period, csv }),
      })
    ),
  reconcileGateway: (period: string): Promise<ApiResponse<Reconciliation>> =>
    safeCall(() =>
      authFetch<Reconciliation>('/admin/journal/reconciliations/gateway', {
        method: 'POST',
        body: JSON.stringify({ period }),
      })
    ),
  resolveItem: (itemId: string, resolution: string): Promise<ApiResponse<Reconciliation>> =>
    safeCall(() =>
      authFetch<Reconciliation>(`/admin/journal/reconciliations/items/${itemId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution }),
      })
    ),
  trialBalance: (): Promise<ApiResponse<TrialBalance>> =>
    safeCall(() => authFetch<TrialBalance>('/admin/journal/trial-balance')),
  latestCheck: (): Promise<ApiResponse<JournalCheck | null>> =>
    safeCall(() => authFetch<JournalCheck | null>('/admin/journal/check')),
  runCheck: (): Promise<ApiResponse<JournalCheck>> =>
    safeCall(() => authFetch<JournalCheck>('/admin/journal/check', { method: 'POST' })),
  leaseEntries: (leaseId: string): Promise<ApiResponse<JournalEntryRow[]>> =>
    safeCall(() => authFetch<JournalEntryRow[]>(`/admin/journal/leases/${leaseId}`)),
};
