import { authFetch, safeCall, type ApiResponse } from '@getrentos/shared';

export type JournalAccount =
  | 'CASH_CLEARING'
  | 'TENANT_RECEIVABLE'
  | 'DEFERRED_RENT'
  | 'OWNER_FUNDS_HELD'
  | 'OWNER_FUNDS_RELEASED'
  | 'TENANT_CREDIT';

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

export const adminJournalService = {
  trialBalance: (): Promise<ApiResponse<TrialBalance>> =>
    safeCall(() => authFetch<TrialBalance>('/admin/journal/trial-balance')),
  latestCheck: (): Promise<ApiResponse<JournalCheck | null>> =>
    safeCall(() => authFetch<JournalCheck | null>('/admin/journal/check')),
  runCheck: (): Promise<ApiResponse<JournalCheck>> =>
    safeCall(() => authFetch<JournalCheck>('/admin/journal/check', { method: 'POST' })),
  leaseEntries: (leaseId: string): Promise<ApiResponse<JournalEntryRow[]>> =>
    safeCall(() => authFetch<JournalEntryRow[]>(`/admin/journal/leases/${leaseId}`)),
};
