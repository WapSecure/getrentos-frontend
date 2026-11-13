import {
  Banknote,
  ClipboardList,
  FileSearch,
  Gavel,
  IdCard,
  Milestone,
  Scale,
  ShieldAlert,
  UsersRound,
  type SgIcon,
} from '@sureground/icons';
import type { DiasporaQueueItem, DiasporaQueueKind } from '@/types/diaspora';

export const DIASPORA_QUEUE_KIND_LABEL: Record<DiasporaQueueKind, string> = {
  FOREIGN_IDENTITY_REVIEW: 'Foreign identity',
  RISK_OR_PROFILE_FLAG: 'Risk flag',
  DILIGENCE_STEP_DUE: 'Diligence report',
  MILESTONE_OVERDUE: 'Milestone',
  LEGAL_STEP_OVERDUE: 'Legal step',
  CO_APPROVAL_PENDING: 'Representative approval',
  DISPUTE_RESPONSE_DUE: 'Dispute',
  MANAGED_INTAKE_REVIEW: 'Managed intake',
  SOURCE_OF_FUNDS_REVIEW: 'Source of funds',
};

export const DIASPORA_QUEUE_KIND_ICON: Record<DiasporaQueueKind, SgIcon> = {
  FOREIGN_IDENTITY_REVIEW: IdCard,
  RISK_OR_PROFILE_FLAG: ShieldAlert,
  DILIGENCE_STEP_DUE: FileSearch,
  MILESTONE_OVERDUE: Milestone,
  LEGAL_STEP_OVERDUE: Scale,
  CO_APPROVAL_PENDING: UsersRound,
  DISPUTE_RESPONSE_DUE: Gavel,
  MANAGED_INTAKE_REVIEW: ClipboardList,
  SOURCE_OF_FUNDS_REVIEW: Banknote,
};

export const DIASPORA_QUEUE_KINDS = Object.keys(DIASPORA_QUEUE_KIND_LABEL) as DiasporaQueueKind[];

/** Source statuses read as words; anything not listed falls back to sentence case. */
const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  ESCALATED: 'Escalated',
  FLAGGED: 'Flagged',
  INVESTIGATING: 'Investigating',
  AWAITING_REPORT: 'Awaiting report',
  AWAITING_CONFLICT_DECLARATION: 'Awaiting conflict declaration',
  PENDING: 'Not yet reported',
  DELIVERED: 'Reported, not confirmed',
  NOT_STARTED: 'Not started',
  SUBMITTED: 'Submitted',
  REJECTED: 'Rejected',
  AWAITING_REPRESENTATIVE: 'Awaiting representative',
  APPEALED: 'Appealed',
  ASSESSMENT_SCHEDULED: 'Assessment booked',
  ASSESSED: 'Assessed, proposal due',
};

export function diasporaStatusLabel(status: string): string {
  if (STATUS_LABEL[status]) return STATUS_LABEL[status];
  const words = status.replaceAll('_', ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const lagosDue = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Lagos',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Business dates are Lagos dates (decision D2): "11 Nov 2026". */
export function formatLagosDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : lagosDue.format(date);
}

const DAY_MS = 86_400_000;
/** Lagos is UTC+1 all year, with no daylight saving. */
const LAGOS_OFFSET_MS = 60 * 60_000;

/** Whole Lagos calendar days since the epoch, so two instants compare by their Lagos dates. */
function lagosDay(date: Date): number {
  return Math.floor((date.getTime() + LAGOS_OFFSET_MS) / DAY_MS);
}

export interface DueDescription {
  /** "3 days overdue", "Due today", "Due in 4 days". */
  label: string;
  /** The Lagos date, "14 Nov 2026"; empty with no deadline. */
  date: string;
  tone: 'overdue' | 'soon' | 'ok' | 'none';
}

/** A deadline as people say it, counted in Lagos days. `overdue` comes from the server. */
export function describeDue(
  dueAt: string | undefined,
  overdue: boolean,
  now: Date = new Date()
): DueDescription {
  const due = dueAt ? new Date(dueAt) : null;
  if (!due || Number.isNaN(due.getTime())) {
    return { label: 'No deadline', date: '', tone: 'none' };
  }
  const days = lagosDay(due) - lagosDay(now);
  const date = formatLagosDate(dueAt as string);
  if (overdue) {
    const late = -days;
    return {
      label: late <= 0 ? 'Overdue' : `${late} day${late === 1 ? '' : 's'} overdue`,
      date,
      tone: 'overdue',
    };
  }
  if (days <= 0) return { label: 'Due today', date, tone: 'soon' };
  if (days === 1) return { label: 'Due tomorrow', date, tone: 'soon' };
  return { label: `Due in ${days} days`, date, tone: 'ok' };
}

/** Open items that read the same: one investor, one kind, one title (six photo-reuse flags, say). */
export interface DiasporaQueueGroup {
  key: string;
  /** In queue order, so the first is the most urgent. */
  items: DiasporaQueueItem[];
}

/** Folds repeated items into groups, keeping queue order by each group's first item. */
export function groupQueueItems(items: DiasporaQueueItem[]): DiasporaQueueGroup[] {
  const groups = new Map<string, DiasporaQueueGroup>();
  for (const item of items) {
    const key = [item.investorId ?? '', item.kind, item.title].join('|');
    const group = groups.get(key);
    if (group) group.items.push(item);
    else groups.set(key, { key, items: [item] });
  }
  return [...groups.values()];
}

export const diasporaQueueKeys = {
  all: ['admin', 'diaspora', 'queue'] as const,
  list: (params: object) => ['admin', 'diaspora', 'queue', params] as const,
};
