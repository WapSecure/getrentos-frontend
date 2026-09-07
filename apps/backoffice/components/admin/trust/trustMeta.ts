import type { TrustReviewCasePriority, TrustReviewCaseStatus } from '@/types/trust';

export const REVIEW_CASE_STATUS_META: Record<
  TrustReviewCaseStatus,
  { label: string; text: string; bg: string }
> = {
  OPEN: {
    label: 'Open',
    text: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  ASSIGNED: {
    label: 'Assigned',
    text: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  ESCALATED: {
    label: 'Escalated',
    text: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  RESOLVED: {
    label: 'Resolved',
    text: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  CLOSED: {
    label: 'Closed',
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800',
  },
};

export const REVIEW_CASE_PRIORITY_META: Record<
  TrustReviewCasePriority,
  { label: string; text: string; bg: string; dot: string }
> = {
  LOW: {
    label: 'Low',
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800',
    dot: 'bg-slate-400',
  },
  MEDIUM: {
    label: 'Medium',
    text: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    dot: 'bg-blue-500',
  },
  HIGH: {
    label: 'High',
    text: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    dot: 'bg-orange-500',
  },
  CRITICAL: {
    label: 'Critical',
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    dot: 'bg-red-500',
  },
};

export const TRUST_STEP_STATUS_META: Record<string, { label: string; text: string; bg: string }> = {
  PASSED: {
    label: 'Passed',
    text: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  FAILED: {
    label: 'Failed',
    text: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
  REVIEW_REQUIRED: {
    label: 'Needs review',
    text: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
  NOT_STARTED: {
    label: 'Not started',
    text: 'text-slate-500',
    bg: 'bg-slate-100 dark:bg-slate-800',
  },
  IN_PROGRESS: {
    label: 'In progress',
    text: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  SKIPPED: { label: 'Skipped', text: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
  EXPIRED: { label: 'Expired', text: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
  WAITING_FOR_USER: {
    label: 'Waiting on user',
    text: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  WAITING_FOR_PROVIDER: {
    label: 'Waiting on provider',
    text: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
  },
};

export const VERIFICATION_STATUS_META: Record<string, { label: string; text: string; bg: string }> =
  {
    COMPLETED: {
      label: 'Completed',
      text: 'text-green-700 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    WAITING_FOR_REVIEW: {
      label: 'Waiting for review',
      text: 'text-orange-700 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    PROCESSING: {
      label: 'Processing',
      text: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    QUEUED: { label: 'Queued', text: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
    FAILED: {
      label: 'Failed',
      text: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
    },
    CANCELLED: { label: 'Cancelled', text: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
    EXPIRED: { label: 'Expired', text: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
  };
