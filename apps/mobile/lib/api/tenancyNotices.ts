import { apiFetch } from './client';
import type { Paginated } from './properties';
import type { LandlordPayment } from './landlord';
import type { BadgeTone } from '@sureground/ui-native';

/** The server decides every state: nothing here recomputes one from a date. Periods are never defaulted: a statutory step is refused until the landlord records one. */

export type NoticeState = 'DRAFT' | 'SERVED' | 'EXPIRED' | 'SUPERSEDED' | 'WITHDRAWN';
export type NoticeKind =
  | 'ARREARS_REMINDER'
  | 'DEMAND_LETTER'
  | 'NOTICE_TO_QUIT'
  | 'NOTICE_OF_INTENTION_TO_RECOVER'
  | 'COURT_SUMMONS';
export type NoticePeriodSource = 'TABLE' | 'FIRM_OVERRIDE' | 'MANUAL' | 'NOT_APPLICABLE';
export type NoticeServiceMethod = 'HAND_DELIVERY' | 'POST' | 'COURIER' | 'EMAIL' | 'OTHER';

export const NOTICE_KIND_LABEL: Record<NoticeKind, string> = {
  ARREARS_REMINDER: 'Arrears reminder',
  DEMAND_LETTER: 'Demand letter',
  NOTICE_TO_QUIT: 'Notice to quit',
  NOTICE_OF_INTENTION_TO_RECOVER: 'Intention to recover',
  COURT_SUMMONS: 'Court summons',
};

export const STATUTORY_KINDS: NoticeKind[] = ['NOTICE_TO_QUIT', 'NOTICE_OF_INTENTION_TO_RECOVER'];

export const AMOUNT_KINDS: NoticeKind[] = ['ARREARS_REMINDER', 'DEMAND_LETTER'];

export const NOTICE_STATE: Record<NoticeState, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  SERVED: { label: 'Running', tone: 'info' },
  EXPIRED: { label: 'Run out', tone: 'success' },
  WITHDRAWN: { label: 'Withdrawn', tone: 'neutral' },
  SUPERSEDED: { label: 'Replaced', tone: 'neutral' },
};

export const SERVICE_METHODS: { value: NoticeServiceMethod; label: string }[] = [
  { value: 'HAND_DELIVERY', label: 'Hand delivery' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'POST', label: 'Post' },
  { value: 'COURIER', label: 'Courier' },
  { value: 'OTHER', label: 'Other' },
];

export const JURISDICTIONS: { value: string; label: string }[] = [
  { value: 'NG-LA', label: 'Lagos' },
  { value: 'NG-FC', label: 'FCT' },
  { value: 'NG', label: 'Nigeria (federal)' },
];

export interface TenancyNotice {
  id: string;
  leaseId: string;
  kind: NoticeKind;
  kindLabel: string;
  rung: number;
  state: NoticeState;
  reason: string;
  arrearsAmount: number | null;
  jurisdiction: string;
  periodDays: number | null;
  periodSource: NoticePeriodSource;
  periodBasis: string | null;
  serviceDate: string | null;
  serviceMethod: NoticeServiceMethod | null;
  servedAt: string | null;
  expiresAt: string | null;
  /** Whole days left. Null when nothing is counting down. */
  daysRemaining: number | null;
  evidenceNote: string | null;
  withdrawnAt: string | null;
  createdByName: string | null;
  createdAt: string;
  property: { id: string; address: string; city: string; state: string } | null;
  tenantName: string | null;
}

export interface NoticePeriodEntry {
  id: string;
  jurisdiction: string;
  kind: NoticeKind;
  kindLabel: string;
  days: number;
  basis: string;
  scope: 'PLATFORM' | 'FIRM';
  editable: boolean;
  updatedAt: string;
}

export interface UnconfiguredPeriod {
  jurisdiction: string;
  kind: NoticeKind;
  basis: string;
}

export interface NoticePeriodSettings {
  entries: NoticePeriodEntry[];
  tableVersion: string;
  unconfigured: UnconfiguredPeriod[];
}

export interface LeaseLadder {
  lease: {
    id: string;
    status: string;
    tenantName: string | null;
    property: { id: string; address: string; city: string; state: string };
  };
  jurisdiction: string;
  jurisdictionDerivedFrom: string;
  jurisdictionFellBack: boolean;
  notices: TenancyNotice[];
  next: { kind: NoticeKind; blockedUntil: string | null } | null;
  nextBlockedReason: string | null;
}

export interface RaiseNoticeInput {
  leaseId: string;
  kind: NoticeKind;
  reason: string;
  arrearsAmount?: number;
  manualDays?: number;
  manualBasis?: string;
}

export function noticeFacts(n: TenancyNotice, fmt: (iso: string) => string): string[] {
  const facts: string[] = [];
  if (n.serviceDate) facts.push(`Served ${fmt(n.serviceDate)}`);
  else if (n.state === 'DRAFT') facts.push('Not served');

  const spent = n.state === 'WITHDRAWN' || n.state === 'SUPERSEDED';
  if (n.expiresAt) {
    const left =
      n.state === 'SERVED' && n.daysRemaining !== null
        ? ` · ${n.daysRemaining} ${n.daysRemaining === 1 ? 'day' : 'days'} left`
        : '';
    const over = n.state === 'EXPIRED' || spent;
    facts.push(`${over ? 'Ran to' : 'Runs to'} ${fmt(n.expiresAt)}${left}`);
  } else if (n.periodDays !== null) {
    facts.push(`Runs ${n.periodDays} days from service`);
  } else {
    facts.push('No set period. This step does not count down');
  }
  if (n.periodSource === 'FIRM_OVERRIDE') facts.push('Period is your own recorded period');
  if (n.periodSource === 'MANUAL') facts.push('Period typed for this notice');
  return facts;
}

export function raiseBlocker(input: {
  kind: NoticeKind;
  reason: string;
  manualDays: string;
  manualBasis: string;
  periodMissing: boolean;
}): string | null {
  const manual = input.manualDays.trim().length > 0;
  if (input.reason.trim().length < 10) return 'Say what the tenant is being told (10+ characters).';
  if (manual && !(Number(input.manualDays) > 0)) return 'Enter the period as whole days.';
  if (manual && input.manualBasis.trim().length < 10)
    return 'Give the basis for the number you typed (10+ characters).';
  if (input.periodMissing && !manual)
    return 'No period is recorded for this step here. Record one, or type one for this notice.';
  return null;
}

export interface ArrearsPayment extends LandlordPayment {
  amountPaid?: number;
  category?: string;
  lateFeeApplied?: boolean;
}

const MS_PER_DAY = 86_400_000;

export const daysOverdue = (dueDate: string, now = Date.now()) =>
  Math.max(0, Math.floor((now - new Date(dueDate).getTime()) / MS_PER_DAY));

export function arrearsStage(days: number): { label: string; tone: BadgeTone } {
  if (days >= 30) return { label: 'Seriously overdue', tone: 'danger' };
  if (days >= 14) return { label: 'Escalating', tone: 'danger' };
  return { label: 'Overdue', tone: 'warning' };
}

export const noticesApi = {
  list: (state?: NoticeState, limit = 200) =>
    apiFetch<{ notices: TenancyNotice[]; limit: number; truncated: boolean }>(
      `/landlord/tenancy-notices?limit=${limit}${state ? `&state=${state}` : ''}`
    ),
  ladder: (leaseId: string) => apiFetch<LeaseLadder>(`/landlord/tenancy-notices/lease/${leaseId}`),
  raise: (input: RaiseNoticeInput) =>
    apiFetch<TenancyNotice>('/landlord/tenancy-notices', { method: 'POST', body: input }),
  serve: (
    id: string,
    input: { serviceDate: string; serviceMethod: NoticeServiceMethod; evidenceNote?: string }
  ) =>
    apiFetch<TenancyNotice>(`/landlord/tenancy-notices/${id}/serve`, {
      method: 'PATCH',
      body: input,
    }),
  periods: () => apiFetch<NoticePeriodSettings>('/landlord/tenancy-notices/periods'),
  setPeriod: (input: { jurisdiction: string; kind: NoticeKind; days: number; basis: string }) =>
    apiFetch<NoticePeriodEntry>('/landlord/tenancy-notices/periods', {
      method: 'POST',
      body: input,
    }),
  clearPeriod: (input: { jurisdiction: string; kind: NoticeKind }) =>
    apiFetch<{ cleared: boolean }>('/landlord/tenancy-notices/periods', {
      method: 'DELETE',
      body: input,
    }),

  overduePayments: (page = 1, pageSize = 20) =>
    apiFetch<Paginated<ArrearsPayment>>(
      `/landlord/payments?status=overdue&sort=due_date_asc&page=${page}&pageSize=${pageSize}`
    ),
};
