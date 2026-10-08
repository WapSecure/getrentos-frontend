import type { LucideIcon } from 'lucide-react';
import {
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
} from 'lucide-react';
import type { BadgeVariant } from '@getrentos/ui';
import type {
  RentPaymentStatus,
  EscrowStatus,
  LeaseStatus,
  ViewingRequestStatus,
  VerificationStatus,
  ListingStatus,
} from '@/types/landlord';
import type { ApplicationStatus } from '@/types/renter';
import type { OfferStatus } from '@/types/owner';
import type { TaskStatus } from '@/types/agent';
import type { LegalCaseStatus } from '@/types/legal-case';

export interface StatusBadgeEntry {
  label: string;
  variant: BadgeVariant;
  icon?: LucideIcon;
}

/**
 * Shared status -> {label, variant} lookups for the `<Badge>` component, so
 * a status vocabulary (payment, lease, application, offer, task, escrow...)
 * is defined once instead of re-declared per card/table with hand-rolled
 * pill markup.
 */
export const paymentStatusBadges: Record<RentPaymentStatus, StatusBadgeEntry> = {
  paid: { label: 'Paid', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  overdue: { label: 'Overdue', variant: 'danger' },
  processing: { label: 'Processing', variant: 'info' },
};

export const escrowStatusBadges: Record<EscrowStatus, StatusBadgeEntry> = {
  not_funded: { label: 'Not paid yet', variant: 'neutral' },
  held: { label: 'Held by GetRentos', variant: 'info', icon: Lock },
  pending_review: { label: 'Under review', variant: 'warning', icon: Clock },
  released: { label: 'Paid to landlord', variant: 'success', icon: CheckCircle2 },
  frozen: { label: 'On hold: dispute open', variant: 'danger', icon: Ban },
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

/**
 * Case statuses.
 *
 * Lives here rather than inside the legal-case components for the same reason
 * every other vocabulary does: so "what colour is filed" has one answer. The
 * `DECIDED` variant is `warning` on purpose — a decision usually starts work
 * (enforcement) rather than ending it, so it should not read as done.
 */
export const legalCaseStatusBadges: Record<LegalCaseStatus, StatusBadgeEntry> = {
  OPEN: { label: 'Open', variant: 'neutral' },
  FILED: { label: 'Filed', variant: 'info' },
  DECIDED: { label: 'Decided', variant: 'warning' },
  CLOSED: { label: 'Closed', variant: 'success' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'neutral' },
};

export const applicationStatusBadges: Record<ApplicationStatus, StatusBadgeEntry> = {
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  under_review: { label: 'Under Review', variant: 'info' },
  approved: { label: 'Approved', variant: 'success', icon: CheckCircle2 },
  rejected: { label: 'Rejected', variant: 'danger', icon: XCircle },
  withdrawn: { label: 'Withdrawn', variant: 'neutral' },
};

/**
 * A property's, or a person's, verification standing.
 *
 * Defined once because the property card, the listing card and the verification
 * banner all render it — and each of them used to carry its own copy of the same
 * four colours, which is why "unverified" was grey in one place and amber in
 * another.
 */
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
