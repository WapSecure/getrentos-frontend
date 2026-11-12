import type { ForeignPurpose, TrustReviewCasePriority, TrustReviewCaseStatus } from '@/types/trust';

export const REVIEW_CASE_STATUS_META: Record<
  TrustReviewCaseStatus,
  { label: string; text: string; bg: string }
> = {
  OPEN: {
    label: 'Open',
    text: 'text-warning',
    bg: 'bg-warning-subtle',
  },
  ASSIGNED: {
    label: 'Assigned',
    text: 'text-info',
    bg: 'bg-info-subtle',
  },
  ESCALATED: {
    label: 'Escalated',
    text: 'text-warning',
    bg: 'bg-warning-subtle',
  },
  RESOLVED: {
    label: 'Resolved',
    text: 'text-success',
    bg: 'bg-success-subtle',
  },
  CLOSED: {
    label: 'Closed',
    text: 'text-muted-foreground',
    bg: 'bg-muted',
  },
};

export const REVIEW_CASE_PRIORITY_META: Record<
  TrustReviewCasePriority,
  { label: string; text: string; bg: string; dot: string }
> = {
  LOW: {
    label: 'Low',
    text: 'text-muted-foreground',
    bg: 'bg-muted',
    dot: 'bg-muted-foreground',
  },
  MEDIUM: {
    label: 'Medium',
    text: 'text-info',
    bg: 'bg-info-subtle',
    dot: 'bg-info',
  },
  HIGH: {
    label: 'High',
    text: 'text-warning',
    bg: 'bg-warning-subtle',
    dot: 'bg-warning',
  },
  CRITICAL: {
    label: 'Critical',
    text: 'text-destructive',
    bg: 'bg-destructive-subtle',
    dot: 'bg-destructive',
  },
};

export const TRUST_STEP_STATUS_META: Record<string, { label: string; text: string; bg: string }> = {
  PASSED: {
    label: 'Passed',
    text: 'text-success',
    bg: 'bg-success-subtle',
  },
  FAILED: {
    label: 'Failed',
    text: 'text-destructive',
    bg: 'bg-destructive-subtle',
  },
  REVIEW_REQUIRED: {
    label: 'Needs review',
    text: 'text-warning',
    bg: 'bg-warning-subtle',
  },
  NOT_STARTED: {
    label: 'Not started',
    text: 'text-muted-foreground',
    bg: 'bg-muted',
  },
  IN_PROGRESS: {
    label: 'In progress',
    text: 'text-info',
    bg: 'bg-info-subtle',
  },
  SKIPPED: { label: 'Skipped', text: 'text-muted-foreground', bg: 'bg-muted' },
  EXPIRED: { label: 'Expired', text: 'text-muted-foreground', bg: 'bg-muted' },
  WAITING_FOR_USER: {
    label: 'Waiting on user',
    text: 'text-warning',
    bg: 'bg-warning-subtle',
  },
  WAITING_FOR_PROVIDER: {
    label: 'Waiting on provider',
    text: 'text-info',
    bg: 'bg-info-subtle',
  },
};

export const VERIFICATION_STATUS_META: Record<string, { label: string; text: string; bg: string }> =
  {
    COMPLETED: {
      label: 'Completed',
      text: 'text-success',
      bg: 'bg-success-subtle',
    },
    WAITING_FOR_REVIEW: {
      label: 'Waiting for review',
      text: 'text-warning',
      bg: 'bg-warning-subtle',
    },
    PROCESSING: {
      label: 'Processing',
      text: 'text-info',
      bg: 'bg-info-subtle',
    },
    QUEUED: { label: 'Queued', text: 'text-muted-foreground', bg: 'bg-muted' },
    FAILED: {
      label: 'Failed',
      text: 'text-destructive',
      bg: 'bg-destructive-subtle',
    },
    CANCELLED: { label: 'Cancelled', text: 'text-muted-foreground', bg: 'bg-muted' },
    EXPIRED: { label: 'Expired', text: 'text-muted-foreground', bg: 'bg-muted' },
  };

/** Diaspora identity cases: decided through their own endpoint, with their uploads shown to staff. */
export const FOREIGN_PURPOSE_LABEL: Record<ForeignPurpose, string> = {
  FOREIGN_IDENTITY: 'Passport (diaspora)',
  FOREIGN_ADDRESS: 'Proof of address abroad',
  FOREIGN_BANK_STATEMENT: 'Bank statement from abroad',
};

export const isForeignPurpose = (purpose?: string | null): purpose is ForeignPurpose =>
  Boolean(purpose && purpose in FOREIGN_PURPOSE_LABEL);
