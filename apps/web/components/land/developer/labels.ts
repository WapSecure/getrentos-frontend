import type { BadgeVariant } from '@getrentos/ui';
import type {
  LandInstallmentStatus,
  LandLayoutStatus,
  LandMilestoneStatus,
  LandPlotStatus,
  LandPurchaseStatus,
  LandTitleEventKind,
} from '@/types/landDeveloper';

type Labelled = { label: string; variant: BadgeVariant };

export const PLOT_STATUS: Record<LandPlotStatus, Labelled> = {
  AVAILABLE: { label: 'Available', variant: 'success' },
  RESERVED: { label: 'Reserved', variant: 'info' },
  UNDER_INSTALLMENT: { label: 'Under installment', variant: 'warning' },
  SOLD: { label: 'Sold', variant: 'neutral' },
  ALLOCATED: { label: 'Allocated', variant: 'neutral' },
  WITHHELD: { label: 'Withheld', variant: 'danger' },
};

export const LAYOUT_STATUS: Record<LandLayoutStatus, Labelled> = {
  DRAFT: { label: 'Draft', variant: 'neutral' },
  PUBLISHED: { label: 'On sale', variant: 'success' },
  CLOSED: { label: 'Closed', variant: 'warning' },
};

export const PURCHASE_STATUS: Record<LandPurchaseStatus, Labelled> = {
  PENDING_DEPOSIT: { label: 'Awaiting deposit', variant: 'info' },
  ACTIVE: { label: 'Paying', variant: 'success' },
  PAID_IN_FULL: { label: 'Paid in full', variant: 'success' },
  COMPLETED: { label: 'Completed', variant: 'neutral' },
  DEFAULTED: { label: 'Defaulted', variant: 'danger' },
  REVOKED: { label: 'Revoked', variant: 'neutral' },
  CANCELLED: { label: 'Cancelled', variant: 'neutral' },
};

export const MILESTONE_STATUS: Record<LandMilestoneStatus, Labelled> = {
  PENDING: { label: 'Pending', variant: 'neutral' },
  DELIVERED: { label: 'Awaiting buyer', variant: 'info' },
  CONFIRMED: { label: 'Confirmed', variant: 'success' },
  DISPUTED: { label: 'Disputed', variant: 'danger' },
  WAIVED: { label: 'Waived', variant: 'neutral' },
};

export const INSTALLMENT_STATUS: Record<LandInstallmentStatus, Labelled> = {
  PENDING: { label: 'Upcoming', variant: 'neutral' },
  PAID: { label: 'Paid', variant: 'success' },
  OVERDUE: { label: 'Overdue', variant: 'danger' },
  WAIVED: { label: 'Waived', variant: 'neutral' },
};

export const TITLE_EVENT_KIND_LABELS: Record<LandTitleEventKind, string> = {
  ORIGINAL_GRANT: 'Original grant',
  EXCISION: 'Excision',
  ALLOCATION: 'Allocation',
  ASSIGNMENT: 'Assignment',
  GOVERNORS_CONSENT: "Governor's Consent",
  CERTIFICATE_OF_OCCUPANCY: 'Certificate of Occupancy',
  RATIFICATION: 'Ratification',
  SUBDIVISION: 'Subdivision',
  MORTGAGE_REGISTERED: 'Mortgage registered',
  OTHER: 'Other',
};

/** Falls back to a readable form of an unknown enum value. */
export const labelOf = <K extends string>(table: Record<K, Labelled>, value: string): Labelled =>
  table[value as K] ?? { label: value.toLowerCase().replace(/_/g, ' '), variant: 'neutral' };

/** Milestones the developer may only deliver once the plot is paid in full. */
export const FULL_PAYMENT_MILESTONES = new Set([
  'PHYSICAL_ALLOCATION',
  'DEED_OF_ASSIGNMENT',
  'SURVEY_PLAN_IN_BUYER_NAME',
]);

export const plotLabel = (plot: { plotNumber: string; block?: string }) =>
  plot.block ? `Block ${plot.block}, plot ${plot.plotNumber}` : `Plot ${plot.plotNumber}`;
