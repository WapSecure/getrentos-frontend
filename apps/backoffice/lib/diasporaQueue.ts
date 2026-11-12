import type { DiasporaQueueKind } from '@/types/diaspora';

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

export const diasporaQueueKeys = {
  all: ['admin', 'diaspora', 'queue'] as const,
  list: (params: object) => ['admin', 'diaspora', 'queue', params] as const,
};
