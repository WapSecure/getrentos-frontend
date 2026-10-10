import { apiDownload, apiFetch, apiUpload } from './client';
import { appendFile, type PickedFile } from './documents';
import type { EstateDuesPoint, Tone } from './estateManager';
import type { Paginated } from './properties';

/**
 * The estate office's records and money: governance documents, the committee,
 * the financial reports, dues statements with their payout, and the public
 * microsite. Manager-side only (`/estate/:id/...`); residents read their own
 * governance and committee through `lib/api/resident`.
 *
 * Plans, as the API enforces them on the ESTATE'S plan (its owner's):
 * - Governance and the committee are on every plan, except that asking the
 *   committee to sign a document is Pro.
 * - Financial reporting (stats, chart, CSV) and the microsite are Pro.
 * - Statements and the payout account are on every plan.
 * A refusal comes back as PLAN_UPGRADE_REQUIRED (see `isUpgradeError`).
 */

/* ---------------------------------- keys ---------------------------------- */

/**
 * Nested under the estate manager's per-estate key, so invalidating
 * `qk.estateManager.estate(id)` refreshes these too.
 */
export const governanceKeys = {
  all: (estateId: string) => ['estate-manager', estateId, 'governance'] as const,
  records: (estateId: string, type: GovernanceFilter = 'all') =>
    ['estate-manager', estateId, 'governance', 'records', type] as const,
  versions: (estateId: string, recordId: string) =>
    ['estate-manager', estateId, 'governance', 'versions', recordId] as const,
  signatures: (estateId: string, recordId: string) =>
    ['estate-manager', estateId, 'governance', 'signatures', recordId] as const,
  committee: (estateId: string) => ['estate-manager', estateId, 'committee'] as const,
  financialStats: (estateId: string, period: ReportPeriod) =>
    ['estate-manager', estateId, 'financials', 'stats', period] as const,
  financialChart: (estateId: string) =>
    ['estate-manager', estateId, 'financials', 'chart'] as const,
  statements: (estateId: string) => ['estate-manager', estateId, 'statements'] as const,
  statementList: (estateId: string) => ['estate-manager', estateId, 'statements', 'list'] as const,
  statement: (estateId: string, statementId: string) =>
    ['estate-manager', estateId, 'statements', 'detail', statementId] as const,
  payoutAccount: (estateId: string) => ['estate-manager', estateId, 'payout-account'] as const,
  microsite: (estateId: string) => ['estate-manager', estateId, 'microsite'] as const,
};

/* ---------------------------------- types --------------------------------- */

export type GovernanceRecordType = 'bylaws' | 'meeting_minutes' | 'other';
export type GovernanceFilter = GovernanceRecordType | 'all';
export type GovernanceRecordStatus = 'published' | 'pending_signatures' | 'approved';

export interface GovernanceRecord {
  id: string;
  estateId: string;
  type: GovernanceRecordType;
  title: string;
  meetingDate?: string;
  /** Already formatted by the API, e.g. "1.2 MB". */
  size: string;
  /** A signed, short-lived download link. */
  url: string;
  version: number;
  rootId?: string;
  requiresSignatures: boolean;
  status: GovernanceRecordStatus;
  /** Present only when the record asks the committee to sign. */
  signatureProgress?: { signed: number; total: number };
  createdAt: string;
}

export type CommitteeTitle = 'president' | 'vice_president' | 'secretary' | 'treasurer' | 'member';

export interface GovernanceSignature {
  id: string;
  committeeMemberId: string;
  unitLabel: string;
  residentName: string;
  title: CommitteeTitle;
  signedAt: string;
}

export interface CommitteeMember {
  id: string;
  estateId: string;
  householdId: string;
  unitLabel: string;
  residentName: string;
  title: CommitteeTitle;
  appointedAt: string;
}

export interface NewGovernanceRecord {
  title: string;
  type: GovernanceRecordType;
  /** `yyyy-MM-dd`; minutes only. */
  meetingDate?: string;
  /** Upload as the next version of this record instead of a new one. */
  newVersionOfId?: string;
  requiresSignatures: boolean;
  file: PickedFile;
}

export type ReportPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface EstateFinancialStats {
  duesCollected: number;
  duesOutstanding: number;
  lateFeesCollected: number;
  householdsBilled: number;
}

export interface MicrositeSettings {
  slug: string;
  bio?: string;
  bannerUrl?: string;
  enabled: boolean;
}

export type StatementStatus = 'DRAFT' | 'ISSUED';
export type StatementPayoutStatus =
  | 'PENDING'
  | 'AWAITING_APPROVAL'
  | 'PAID'
  | 'FAILED'
  | 'REJECTED';
export type DisputeMoneyEffect = 'HELD' | 'IN_FLIGHT' | 'PAID' | 'NONE';

export interface StatementRelease {
  id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
  thresholdAtRequest: number;
}

export interface StatementLineDispute {
  id: string;
  statementId: string;
  lineId: string;
  lineLabel: string;
  lineAmount: number;
  reason: string;
  status: 'OPEN' | 'UPHELD' | 'REJECTED' | 'WITHDRAWN';
  raisedByName: string | null;
  firmResponse: string | null;
  outcomeNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  moneyEffect: DisputeMoneyEffect;
}

export interface StatementDisputeSummary {
  openCount: number;
  totalCount: number;
  moneyEffect: DisputeMoneyEffect;
  reason: string | null;
}

export interface StatementLineItem {
  id: string;
  label: string;
  amount: number;
}

export interface EstateStatement {
  id: string;
  periodStart: string;
  periodEnd: string;
  grossIncome: number;
  totalExpenses: number;
  managementFee: number;
  vatAmount?: number | null;
  maintenanceMarkup?: number | null;
  whtAmount?: number | null;
  netPayout: number;
  status: StatementStatus;
  payoutStatus: StatementPayoutStatus;
  transferRef?: string;
  paidAt: string | null;
  generatedAt: string;
  issuedAt: string | null;
  /** Detail response only. */
  release?: StatementRelease | null;
  disputes?: StatementLineDispute[];
  disputeSummary?: StatementDisputeSummary | null;
  lineItems?: StatementLineItem[];
}

export interface EstatePayoutAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  verified: boolean;
}

/* ----------------------------------- api ---------------------------------- */

export const STATEMENTS_PAGE_SIZE = 10;

export const estateGovernanceApi = {
  governance: (estateId: string, type: GovernanceFilter = 'all') =>
    apiFetch<GovernanceRecord[]>(
      `/estate/${estateId}/governance${type === 'all' ? '' : `?type=${type}`}`
    ),
  governanceVersions: (estateId: string, recordId: string) =>
    apiFetch<GovernanceRecord[]>(`/estate/${estateId}/governance/${recordId}/versions`),
  governanceSignatures: (estateId: string, recordId: string) =>
    apiFetch<GovernanceSignature[]>(`/estate/${estateId}/governance/${recordId}/signatures`),
  uploadGovernance: (estateId: string, input: NewGovernanceRecord) => {
    const form = new FormData();
    form.append('title', input.title);
    form.append('type', input.type.toUpperCase());
    if (input.meetingDate) form.append('meetingDate', input.meetingDate);
    if (input.newVersionOfId) form.append('newVersionOfId', input.newVersionOfId);
    form.append('requiresSignatures', String(input.requiresSignatures));
    appendFile(form, 'file', input.file);
    return apiUpload<GovernanceRecord>(`/estate/${estateId}/governance`, form);
  },
  removeGovernance: (estateId: string, recordId: string) =>
    apiFetch<void>(`/estate/${estateId}/governance/${recordId}`, { method: 'DELETE' }),

  committee: (estateId: string) => apiFetch<CommitteeMember[]>(`/estate/${estateId}/committee`),
  /** Upserts the household's one seat: appointing a sitting member changes their title. */
  appoint: (estateId: string, householdId: string, title: CommitteeTitle) =>
    apiFetch<CommitteeMember>(`/estate/${estateId}/committee`, {
      method: 'POST',
      body: { householdId, title: title.toUpperCase() },
    }),
  removeMember: (estateId: string, memberId: string) =>
    apiFetch<void>(`/estate/${estateId}/committee/${memberId}`, { method: 'DELETE' }),

  financialStats: (estateId: string, period: ReportPeriod) =>
    apiFetch<EstateFinancialStats>(`/estate/${estateId}/financials/stats?period=${period}`),
  financialChart: (estateId: string) =>
    apiFetch<EstateDuesPoint[]>(`/estate/${estateId}/financials/chart`),
  /** Every due as CSV; bytes to write to disk and share. */
  financialsExport: (estateId: string) => apiDownload(`/estate/${estateId}/financials/export`),

  statements: (estateId: string, page = 1) =>
    apiFetch<Paginated<EstateStatement>>(
      `/estate/${estateId}/statements?page=${page}&pageSize=${STATEMENTS_PAGE_SIZE}`
    ),
  statement: (estateId: string, statementId: string) =>
    apiFetch<EstateStatement>(`/estate/${estateId}/statements/${statementId}`),
  generateStatement: (estateId: string, body: { periodStart: string; periodEnd: string }) =>
    apiFetch<EstateStatement>(`/estate/${estateId}/statements/generate`, { method: 'POST', body }),
  issueStatement: (estateId: string, statementId: string) =>
    apiFetch<EstateStatement>(`/estate/${estateId}/statements/${statementId}/issue`, {
      method: 'POST',
    }),
  retryPayout: (estateId: string, statementId: string) =>
    apiFetch<EstateStatement>(`/estate/${estateId}/statements/${statementId}/retry-payout`, {
      method: 'POST',
    }),

  payoutAccount: (estateId: string) =>
    apiFetch<EstatePayoutAccount>(`/estate/${estateId}/payout-account`),
  /** Needs a fresh "confirm it's you"; `apiFetch` prompts for it and replays. */
  updatePayoutAccount: (estateId: string, body: { bankCode: string; accountNumber: string }) =>
    apiFetch<EstatePayoutAccount>(`/estate/${estateId}/payout-account`, { method: 'POST', body }),

  microsite: (estateId: string) => apiFetch<MicrositeSettings>(`/estate/${estateId}/microsite`),
  updateMicrosite: (
    estateId: string,
    body: Partial<{ slug: string; bio: string; enabled: boolean }>
  ) => apiFetch<MicrositeSettings>(`/estate/${estateId}/microsite`, { method: 'PATCH', body }),
  uploadMicrositeBanner: (estateId: string, file: PickedFile) => {
    const form = new FormData();
    appendFile(form, 'file', file);
    return apiUpload<MicrositeSettings>(`/estate/${estateId}/microsite/banner`, form);
  },
};

/* ------------------------------- governance ------------------------------- */

export const GOVERNANCE_TYPES: { value: GovernanceRecordType; label: string }[] = [
  { value: 'bylaws', label: 'Bylaws' },
  { value: 'meeting_minutes', label: 'Minutes' },
  { value: 'other', label: 'Other' },
];

export const governanceTypeLabel = (t: GovernanceRecordType) =>
  t === 'meeting_minutes' ? 'Meeting minutes' : t === 'bylaws' ? 'Bylaws' : 'Document';

/** Matches the API's limits: a title of up to 150 characters and a 20 MB file. */
export const GOVERNANCE_TITLE_MAX = 150;
export const GOVERNANCE_MAX_BYTES = 20 * 1024 * 1024;

/**
 * Where a record stands with the committee's signatures, or null when it never
 * asked for any. A record nobody can sign yet (no committee) says so rather
 * than "0 of 0 signed", which reads as done.
 */
export function signatureState(
  r: Pick<GovernanceRecord, 'requiresSignatures' | 'status' | 'signatureProgress'>
): { label: string; tone: Tone } | null {
  if (!r.requiresSignatures) return null;
  if (r.status === 'approved') return { label: 'Fully signed', tone: 'success' };
  const p = r.signatureProgress;
  if (!p || p.total === 0) return { label: 'No committee to sign yet', tone: 'warning' };
  return { label: `${p.signed} of ${p.total} signed`, tone: 'warning' };
}

/* -------------------------------- committee ------------------------------- */

export const COMMITTEE_TITLES: { value: CommitteeTitle; label: string }[] = [
  { value: 'president', label: 'President' },
  { value: 'vice_president', label: 'Vice president' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'member', label: 'Member' },
];

export const committeeTitleLabel = (t: string) =>
  COMMITTEE_TITLES.find((x) => x.value === t)?.label ?? 'Member';

/** The board in rank order (president first), longest-serving first within a rank. */
export function committeeOrder<T extends Pick<CommitteeMember, 'title' | 'appointedAt'>>(
  members: T[]
): T[] {
  const rank = (t: string) => {
    const i = COMMITTEE_TITLES.findIndex((x) => x.value === t);
    return i === -1 ? COMMITTEE_TITLES.length : i;
  };
  return [...members].sort(
    (a, b) => rank(a.title) - rank(b.title) || a.appointedAt.localeCompare(b.appointedAt)
  );
}

/* ------------------------------- financials ------------------------------- */

export const REPORT_PERIODS: { value: ReportPeriod; label: string; span: string }[] = [
  { value: 'monthly', label: 'Month', span: 'the last month' },
  { value: 'quarterly', label: 'Quarter', span: 'the last 3 months' },
  { value: 'yearly', label: 'Year', span: 'the last 12 months' },
];

/* ------------------------------- statements ------------------------------- */

/** Neither held state is a failure: the money has not been sent, not lost. */
export const PAYOUT_STATE: Record<StatementPayoutStatus, { label: string; tone: Tone }> = {
  PAID: { label: 'Paid out', tone: 'success' },
  PENDING: { label: 'Payout on its way', tone: 'info' },
  AWAITING_APPROVAL: { label: 'Waiting for a second check', tone: 'info' },
  FAILED: { label: 'Payout didn’t go through', tone: 'danger' },
  REJECTED: { label: 'Payout held back', tone: 'warning' },
};

/** The one badge a statement row needs: a draft is just a draft. */
export function statementBadge(s: Pick<EstateStatement, 'status' | 'payoutStatus'>): {
  label: string;
  tone: Tone;
} {
  if (s.status === 'DRAFT') return { label: 'Draft', tone: 'neutral' };
  return PAYOUT_STATE[s.payoutStatus] ?? { label: 'Issued', tone: 'neutral' };
}

export const canRetryPayout = (s: Pick<EstateStatement, 'status' | 'payoutStatus'>) =>
  s.status === 'ISSUED' && (s.payoutStatus === 'FAILED' || s.payoutStatus === 'REJECTED');

/**
 * The ladder from gross income down to the payout. VAT and the maintenance
 * markup are steps only when charged; withholding tax is never a step (it is
 * withheld from the manager's fee, not the payout) so it is left to a note.
 */
export function statementLadder(
  s: Pick<
    EstateStatement,
    'grossIncome' | 'totalExpenses' | 'managementFee' | 'vatAmount' | 'maintenanceMarkup'
  >
): { label: string; amount: number; deduction: boolean }[] {
  const rows = [
    { label: 'Gross income', amount: s.grossIncome, deduction: false },
    { label: 'Expenses', amount: s.totalExpenses, deduction: true },
  ];
  if ((s.maintenanceMarkup ?? 0) > 0)
    rows.push({ label: 'Maintenance markup', amount: s.maintenanceMarkup ?? 0, deduction: true });
  rows.push({ label: 'Management fee', amount: s.managementFee, deduction: true });
  if ((s.vatAmount ?? 0) > 0)
    rows.push({ label: 'VAT on the fee', amount: s.vatAmount ?? 0, deduction: true });
  return rows;
}

/**
 * Why an issued statement's money has not gone out, in words, or null when
 * nothing is holding it. A dispute that is holding the money is the reason
 * that matters, so it wins over a second-approval hold.
 */
export function payoutHold(
  s: Pick<EstateStatement, 'status' | 'payoutStatus' | 'release' | 'disputeSummary'>
): { title: string; body: string; quote?: string | null; tone: Tone } | null {
  if (s.status !== 'ISSUED') return null;
  const d = s.disputeSummary;
  const open = d?.openCount ?? 0;
  if (d?.moneyEffect === 'HELD') {
    return {
      title: 'Paused while a line is disputed',
      body: `${open === 1 ? 'A line on this statement is' : `${open} lines on this statement are`} being looked at, so the payout waits until ${open === 1 ? 'it is' : 'they are'} decided. Nothing has left the account. If a query is upheld, the correction shows on the next statement.`,
      quote: d.reason,
      tone: 'warning',
    };
  }
  if (s.payoutStatus === 'REJECTED') {
    return {
      title: 'This payout was held back',
      body: 'A second reviewer held it back. The money is still owed to the estate: it hasn’t been sent, rather than lost. You can send it for approval again once their concern is dealt with.',
      quote: s.release?.decisionNote,
      tone: 'warning',
    };
  }
  if (s.payoutStatus === 'AWAITING_APPROVAL') {
    const threshold = s.release?.thresholdAtRequest;
    return {
      title: 'Waiting for a second check',
      body: `${threshold ? `Payouts of ₦${Math.round(threshold).toLocaleString('en-NG')} or more` : 'Larger payouts'} are released by two people, so a second GetRentos officer checks this one before it is sent. Nothing has left the account.`,
      tone: 'info',
    };
  }
  if (open > 0 && (d?.moneyEffect === 'IN_FLIGHT' || d?.moneyEffect === 'PAID')) {
    return {
      title: 'A line on this statement is being looked at',
      body: `This payout ${d.moneyEffect === 'PAID' ? 'has already been sent' : 'is already with the bank'}, so it can’t be paused. If the query is upheld, the correction shows on the next statement.`,
      quote: d.reason,
      tone: 'neutral',
    };
  }
  return null;
}

/** What to tell the manager after issuing or retrying, by where the money ended up. */
export function payoutOutcome(
  payoutStatus: StatementPayoutStatus,
  action: 'issue' | 'retry'
): { message: string; ok: boolean } {
  switch (payoutStatus) {
    case 'PAID':
      return {
        message: action === 'issue' ? 'Statement issued and paid out.' : 'Payout sent.',
        ok: true,
      };
    case 'PENDING':
      return { message: 'Statement issued. The payout is on its way.', ok: true };
    case 'AWAITING_APPROVAL':
      return {
        message: 'Held for a second check before it’s sent. Nothing has left the account.',
        ok: true,
      };
    case 'REJECTED':
      return { message: 'The payout is still held back by a reviewer.', ok: false };
    case 'FAILED':
    default:
      return {
        message:
          action === 'issue'
            ? 'Statement issued, but the payout didn’t go through. Check the payout account and retry.'
            : 'The payout failed again. Check the payout account and try again.',
        ok: false,
      };
  }
}

/** Last calendar month, as `yyyy-MM-dd`: the period most often closed. */
export function lastMonthPeriod(now: Date = new Date()): {
  periodStart: string;
  periodEnd: string;
} {
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return {
    periodStart: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    periodEnd: iso(new Date(now.getFullYear(), now.getMonth(), 0)),
  };
}

/** A NUBAN is ten digits; bank codes run three to six. Mirrors the API's rule. */
export const payoutAccountValid = (bankCode: string, accountNumber: string) =>
  /^\d{3,6}$/.test(bankCode.trim()) && /^\d{10}$/.test(accountNumber.trim());

/* -------------------------------- microsite ------------------------------- */

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const MICROSITE_SLUG_MAX = 60;
export const MICROSITE_BIO_MAX = 500;
/** The banner limit the API enforces. */
export const MICROSITE_BANNER_MAX_BYTES = 5 * 1024 * 1024;

export const isValidSlug = (slug: string) => slug.length <= MICROSITE_SLUG_MAX && SLUG.test(slug);

/** A link as typed, made into one the API accepts where it can: lower case, spaces to hyphens. */
export const normaliseSlug = (input: string) =>
  input
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-');

/** The public address of an estate's page on the website. */
export const micrositeUrl = (webUrl: string, slug: string) =>
  `${webUrl.replace(/\/$/, '')}/e/${slug}`;
