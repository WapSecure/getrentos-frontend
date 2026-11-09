import type { SgIcon } from '@sureground/icons';
import {
  AlertCircle,
  Lock,
  Clock,
  CheckCircle2,
  Ban,
  RefreshCcw,
  XCircle,
  Archive,
  PlayCircle,
  PauseCircle,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from '@sureground/icons';
import type { BadgeVariant } from '@sureground/ui';
import type {
  RentPaymentStatus,
  RentPayoutStatus,
  EscrowStatus,
  LeaseStatus,
  ViewingRequestStatus,
  VerificationStatus,
  ListingStatus,
  LeadStage,
} from '@/types/landlord';
import type { ApplicationStatus } from '@/types/renter';
import type { MaintenancePriority, MaintenanceRequestStatus } from '@/types/maintenance';
import type { OfferStatus } from '@/types/owner';
import type { TaskStatus } from '@/types/agent';
import type { LegalCaseStatus } from '@/types/legal-case';

export interface StatusBadgeEntry {
  label: string;
  variant: BadgeVariant;
  icon?: SgIcon;
}

// `pending` reads "Due": "Pending" would suggest money already sent. Mobile uses the same words (apps/mobile/lib/api/payments.ts).
export const paymentStatusBadges: Record<RentPaymentStatus, StatusBadgeEntry> = {
  paid: { label: 'Paid', variant: 'success', icon: CheckCircle2 },
  pending: { label: 'Due', variant: 'neutral', icon: Clock },
  overdue: { label: 'Overdue', variant: 'danger', icon: AlertCircle },
  processing: { label: 'Processing', variant: 'info', icon: RefreshCcw },
};

export const escrowStatusBadges: Record<EscrowStatus, StatusBadgeEntry> = {
  not_funded: { label: 'Not paid yet', variant: 'neutral' },
  held: { label: 'Held by Sureground', variant: 'info', icon: Lock },
  pending_review: { label: 'Under review', variant: 'warning', icon: Clock },
  // Released from escrow is not yet money in the landlord's bank: the transfer is a separate step.
  released: { label: 'Released to landlord', variant: 'success', icon: CheckCircle2 },
  frozen: { label: 'On hold: dispute open', variant: 'danger', icon: Ban },
};

export const rentPayoutStatusBadges: Record<RentPayoutStatus, StatusBadgeEntry> = {
  QUEUED: { label: 'Queued for payout', variant: 'neutral', icon: Clock },
  SENT: { label: 'Sent to bank', variant: 'info' },
  PAID: { label: 'Paid to bank', variant: 'success', icon: CheckCircle2 },
  FAILED: { label: 'Payout failed', variant: 'danger', icon: XCircle },
};

export const leaseStatusBadges: Record<LeaseStatus, StatusBadgeEntry> = {
  draft: { label: 'Draft', variant: 'neutral' },
  sent: { label: 'Awaiting tenant signature', variant: 'info' },
  awaiting_payment: { label: 'Awaiting first payment', variant: 'warning', icon: Clock },
  awaiting_landlord: { label: 'Awaiting handover', variant: 'info', icon: Lock },
  signed: { label: 'Signed', variant: 'success' },
  lapsed: { label: 'Lapsed unpaid', variant: 'danger', icon: XCircle },
  expired: { label: 'Expired', variant: 'danger' },
};

export const viewingRequestStatusBadges: Record<ViewingRequestStatus, StatusBadgeEntry> = {
  requested: { label: 'Requested', variant: 'warning', icon: Clock },
  confirmed: { label: 'Confirmed', variant: 'info', icon: CheckCircle2 },
  completed: { label: 'Completed', variant: 'success', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', variant: 'neutral', icon: XCircle },
};

// `DECIDED` is `warning` on purpose: a decision usually starts enforcement rather than ending the case.
export const legalCaseStatusBadges: Record<LegalCaseStatus, StatusBadgeEntry> = {
  OPEN: { label: 'Open', variant: 'neutral' },
  FILED: { label: 'Filed', variant: 'info' },
  DECIDED: { label: 'Decided', variant: 'warning' },
  CLOSED: { label: 'Closed', variant: 'success' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'neutral' },
};

export const leadStageBadges: Record<LeadStage, StatusBadgeEntry> = {
  inquiry: { label: 'Inquiry', variant: 'info' },
  requested: { label: 'Viewing Requested', variant: 'warning', icon: Clock },
  confirmed: { label: 'Viewing Confirmed', variant: 'info', icon: CheckCircle2 },
  completed: { label: 'Viewing Completed', variant: 'success', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', variant: 'neutral', icon: XCircle },
  pending: { label: 'Applied', variant: 'info' },
  under_review: { label: 'Under Review', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success', icon: CheckCircle2 },
  rejected: { label: 'Rejected', variant: 'danger', icon: XCircle },
};

export const maintenancePriorityBadges: Record<MaintenancePriority, StatusBadgeEntry> = {
  low: { label: 'Low', variant: 'neutral' },
  medium: { label: 'Medium', variant: 'info' },
  high: { label: 'High', variant: 'warning' },
  urgent: { label: 'Urgent', variant: 'danger' },
};

export const maintenanceStatusBadges: Record<MaintenanceRequestStatus, StatusBadgeEntry> = {
  submitted: { label: 'Submitted', variant: 'warning' },
  assigned: { label: 'Assigned', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'info' },
  resolved: { label: 'Resolved', variant: 'success', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', variant: 'neutral', icon: XCircle },
};

export const applicationStatusBadges: Record<ApplicationStatus, StatusBadgeEntry> = {
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  under_review: { label: 'Under Review', variant: 'info' },
  approved: { label: 'Approved', variant: 'success', icon: CheckCircle2 },
  rejected: { label: 'Rejected', variant: 'danger', icon: XCircle },
  withdrawn: { label: 'Withdrawn', variant: 'neutral' },
};

export const verificationBadges: Record<VerificationStatus, StatusBadgeEntry> = {
  verified: { label: 'Verified', variant: 'success', icon: ShieldCheck },
  pending: { label: 'Pending review', variant: 'warning', icon: ShieldAlert },
  unverified: { label: 'Unverified', variant: 'neutral', icon: ShieldAlert },
  rejected: { label: 'Rejected', variant: 'danger', icon: ShieldX },
};

export const listingStatusBadges: Record<ListingStatus, StatusBadgeEntry> = {
  draft: { label: 'Draft', variant: 'neutral' },
  pending_verification: { label: 'Pending verification', variant: 'warning', icon: Clock },
  published: { label: 'Published', variant: 'success', icon: CheckCircle2 },
  paused: { label: 'Paused', variant: 'neutral', icon: PauseCircle },
  closed: { label: 'Closed', variant: 'danger', icon: XCircle },
};

export const offerStatusBadges: Record<OfferStatus, StatusBadgeEntry> = {
  submitted: { label: 'Submitted', variant: 'warning', icon: Clock },
  countered: { label: 'Countered', variant: 'info', icon: RefreshCcw },
  accepted: { label: 'Accepted', variant: 'success', icon: CheckCircle2 },
  rejected: { label: 'Rejected', variant: 'danger', icon: XCircle },
  withdrawn: { label: 'Withdrawn', variant: 'neutral', icon: XCircle },
  expired: { label: 'Expired', variant: 'neutral', icon: Archive },
  closed: { label: 'Closed', variant: 'neutral', icon: Archive },
};

export const taskStatusBadges: Record<TaskStatus, StatusBadgeEntry> = {
  assigned: { label: 'Assigned', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'warning', icon: PlayCircle },
  completed: { label: 'Completed', variant: 'success', icon: CheckCircle2 },
  overdue: { label: 'Overdue', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
};
