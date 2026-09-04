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
} from 'lucide-react';
import type { BadgeVariant } from '@getrentos/ui';
import type {
  RentPaymentStatus,
  EscrowStatus,
  LeaseStatus,
  EvictionStatus,
} from '@/types/landlord';
import type { ApplicationStatus } from '@/types/renter';
import type { OfferStatus } from '@/types/owner';
import type { TaskStatus } from '@/types/agent';

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
  held: { label: 'Held', variant: 'info', icon: Lock },
  pending_review: { label: 'Pending Review', variant: 'warning', icon: Clock },
  released: { label: 'Released', variant: 'success', icon: CheckCircle2 },
  frozen: { label: 'Frozen', variant: 'danger', icon: Ban },
};

export const leaseStatusBadges: Record<LeaseStatus, StatusBadgeEntry> = {
  draft: { label: 'Draft', variant: 'neutral' },
  sent: { label: 'Sent', variant: 'info' },
  signed: { label: 'Signed', variant: 'success' },
  expired: { label: 'Expired', variant: 'danger' },
};

export const evictionStatusBadges: Record<EvictionStatus, StatusBadgeEntry> = {
  draft: { label: 'Draft', variant: 'neutral' },
  issued: { label: 'Notice issued', variant: 'warning' },
  filed: { label: 'Filed', variant: 'info' },
  resolved: { label: 'Resolved', variant: 'success' },
  withdrawn: { label: 'Withdrawn', variant: 'neutral' },
};

export const applicationStatusBadges: Record<ApplicationStatus, StatusBadgeEntry> = {
  pending: { label: 'Pending', variant: 'warning', icon: Clock },
  under_review: { label: 'Under Review', variant: 'info' },
  approved: { label: 'Approved', variant: 'success', icon: CheckCircle2 },
  rejected: { label: 'Rejected', variant: 'danger', icon: XCircle },
  withdrawn: { label: 'Withdrawn', variant: 'neutral' },
};

export const offerStatusBadges: Record<OfferStatus, StatusBadgeEntry> = {
  submitted: { label: 'Submitted', variant: 'warning', icon: Clock },
  countered: { label: 'Countered', variant: 'info', icon: RefreshCcw },
  accepted: { label: 'Accepted', variant: 'success', icon: CheckCircle2 },
  rejected: { label: 'Rejected', variant: 'danger', icon: XCircle },
  closed: { label: 'Closed', variant: 'neutral', icon: Archive },
};

export const taskStatusBadges: Record<TaskStatus, StatusBadgeEntry> = {
  assigned: { label: 'Assigned', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'warning', icon: PlayCircle },
  completed: { label: 'Completed', variant: 'success', icon: CheckCircle2 },
  overdue: { label: 'Overdue', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
};
