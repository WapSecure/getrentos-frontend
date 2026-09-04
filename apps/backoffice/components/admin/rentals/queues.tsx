'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Badge, type BadgeVariant, Button, Select, type SelectOption } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import type { ApiResponse } from '@getrentos/shared';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  ClipboardList,
  CalendarClock,
  Scroll,
  RefreshCw,
  FileX2,
  Gavel,
} from 'lucide-react';
import { adminRentalService } from '@/services/adminRentalService';
import { RentalQueuePage, type RentalQueueConfig } from './RentalQueuePage';
import type {
  AdminRentalApplication,
  AdminRentalEviction,
  AdminRentalLease,
  AdminRentalListing,
  AdminRentalRenewal,
  AdminRentalTermination,
  AdminRentalViewing,
  RentalEvictionStatus,
  RentalLeaseStatus,
} from '@/types/rental';

const naira = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);

const date = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const Pill = ({ label, variant }: { label: string; variant: BadgeVariant }) => (
  <Badge variant={variant}>{label}</Badge>
);

const Cell = ({ primary, secondary }: { primary: ReactNode; secondary?: ReactNode }) => (
  <div className="min-w-0">
    <p className="font-medium text-foreground">{primary}</p>
    {secondary && <p className="text-xs text-muted-foreground truncate">{secondary}</p>}
  </div>
);

const listingStatusVariant = (status: string): BadgeVariant => {
  const map: Record<string, BadgeVariant> = {
    PUBLISHED: 'success',
    PENDING_VERIFICATION: 'warning',
    PAUSED: 'warning',
    CLOSED: 'neutral',
    DRAFT: 'neutral',
  };
  return map[status] ?? 'neutral';
};
const applicationStatusVariant = (status: string): BadgeVariant => {
  const map: Record<string, BadgeVariant> = {
    APPROVED: 'success',
    REJECTED: 'danger',
    UNDER_REVIEW: 'info',
    PENDING: 'warning',
  };
  return map[status] ?? 'neutral';
};
const viewingStatusVariant = (status: string): BadgeVariant => {
  const map: Record<string, BadgeVariant> = {
    COMPLETED: 'success',
    CONFIRMED: 'info',
    REQUESTED: 'warning',
    CANCELLED: 'neutral',
  };
  return map[status] ?? 'neutral';
};
const lifecycleVariant = (status: string): BadgeVariant => {
  const map: Record<string, BadgeVariant> = {
    SIGNED: 'success',
    SENT: 'info',
    EXPIRED: 'neutral',
    DRAFT: 'neutral',
    ACCEPTED: 'success',
    DECLINED: 'danger',
    REJECTED: 'danger',
    APPROVED: 'success',
    RESOLVED: 'success',
    WITHDRAWN: 'neutral',
    ISSUED: 'warning',
    FILED: 'info',
    PENDING: 'warning',
  };
  return map[status] ?? 'neutral';
};

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

function useQueueActions(resource: string) {
  const queryClient = useQueryClient();
  return async <T,>(run: () => Promise<ApiResponse<T>>) => {
    try {
      await unwrap(run());
    } catch {
      // Surface failures silently in the console; data stays unchanged.
      console.error(`Rental ${resource} action failed`);
    } finally {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rentals', resource] });
    }
  };
}

/** Inline status editor used for lease and eviction lifecycle correction. */
function StatusCell({
  current,
  options,
  onSave,
}: {
  current: string;
  options: { value: string; label: string }[];
  onSave: (status: string) => void;
}) {
  const [value, setValue] = useState(current);
  const selectOptions: SelectOption[] = options.map((o) => ({ value: o.value, label: o.label }));
  return (
    <div className="flex items-center gap-2">
      <div className="w-40">
        <Select value={value} onValueChange={setValue} options={selectOptions} ariaLabel="Status" />
      </div>
      {value !== current && (
        <Button type="button" size="sm" variant="secondary" onClick={() => onSave(value)}>
          Save
        </Button>
      )}
    </div>
  );
}

const listingStatusOptions = [
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'PENDING_VERIFICATION', label: 'Pending verification' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'CLOSED', label: 'Closed' },
];
const applicationStatusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];
const viewingStatusOptions = [
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];
const leaseStatusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'SIGNED', label: 'Signed' },
  { value: 'EXPIRED', label: 'Expired' },
];
const renewalStatusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
];
const terminationStatusOptions = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];
const evictionStatusOptions = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'FILED', label: 'Filed' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

const btn = (
  label: string,
  onClick: () => void,
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' = 'outline'
) => (
  <Button type="button" size="xs" variant={variant} onClick={onClick}>
    {label}
  </Button>
);

const noRowActions = () => null;

function ActionGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1.5">{children}</div>;
}

export function ListingsQueue() {
  const run = useQueueActions('listings');
  const config: RentalQueueConfig<AdminRentalListing> = {
    resource: 'listings',
    eyebrow: 'Rental Listings',
    title: 'Long-term listings',
    description: 'Platform-wide RENT/SALE listings with moderation controls.',
    icon: Building2,
    statusOptions: listingStatusOptions,
    listFn: (params) => adminRentalService.listListings(params),
    getRowKey: (l) => l.id,
    columns: [
      {
        key: 'listing',
        header: 'Listing',
        render: (l) => (
          <Cell primary={l.title} secondary={`${l.propertyTitle} · ${l.city}, ${l.state}`} />
        ),
      },
      {
        key: 'type',
        header: 'Type',
        render: (l) => <Pill label={l.listingType} variant="neutral" />,
      },
      {
        key: 'price',
        header: 'Price',
        render: (l) => <p className="font-medium text-foreground">{naira(l.price)}</p>,
      },
      {
        key: 'owner',
        header: 'Owner',
        render: (l) => <Cell primary={l.ownerName} secondary={l.ownerEmail ?? ''} />,
      },
      {
        key: 'status',
        header: 'Status',
        render: (l) => (
          <Pill label={titleCase(l.status)} variant={listingStatusVariant(l.status)} />
        ),
      },
      {
        key: 'created',
        header: 'Created',
        render: (l) => <span className="text-muted-foreground">{date(l.createdAt)}</span>,
      },
    ],
    actions: (l) => (
      <ActionGroup>
        {l.status === 'PUBLISHED' &&
          btn('Pause', () => run(() => adminRentalService.pauseListing(l.id)))}
        {l.status === 'PUBLISHED' &&
          btn('Flag', () => run(() => adminRentalService.flagListing(l.id)), 'ghost')}
        {l.status === 'PAUSED' &&
          btn('Resume', () => run(() => adminRentalService.resumeListing(l.id)))}
        {l.status === 'PAUSED' &&
          btn('Close', () => run(() => adminRentalService.closeListing(l.id)), 'danger')}
        {l.status === 'PENDING_VERIFICATION' &&
          btn('Approve', () => run(() => adminRentalService.approveListing(l.id)))}
        {l.status === 'PENDING_VERIFICATION' &&
          btn('Close', () => run(() => adminRentalService.closeListing(l.id)), 'danger')}
        {l.status === 'DRAFT' &&
          btn('Close', () => run(() => adminRentalService.closeListing(l.id)), 'danger')}
      </ActionGroup>
    ),
  };
  return <RentalQueuePage config={config} />;
}

export function ApplicationsQueue() {
  const run = useQueueActions('applications');
  const config: RentalQueueConfig<AdminRentalApplication> = {
    resource: 'applications',
    eyebrow: 'Rental Applications',
    title: 'Rental application triage',
    description: 'Platform-wide rental applications with status corrections.',
    icon: ClipboardList,
    statusOptions: applicationStatusOptions,
    listFn: (params) => adminRentalService.listApplications(params),
    getRowKey: (a) => a.id,
    columns: [
      {
        key: 'applicant',
        header: 'Applicant',
        render: (a) => (
          <Cell primary={a.applicantName} secondary={`${a.applicantEmail} · ${a.applicantPhone}`} />
        ),
      },
      {
        key: 'unit',
        header: 'Unit',
        render: (a) => (
          <Cell primary={a.propertyTitle} secondary={a.unitName ?? `${a.city}, ${a.state}`} />
        ),
      },
      {
        key: 'income',
        header: 'Income / Term',
        render: (a) => (
          <Cell
            primary={naira(a.monthlyIncome)}
            secondary={a.leaseTerm ? `${a.leaseTerm}` : undefined}
          />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (a) => (
          <Pill label={titleCase(a.status)} variant={applicationStatusVariant(a.status)} />
        ),
      },
      {
        key: 'created',
        header: 'Applied',
        render: (a) => <span className="text-muted-foreground">{date(a.createdAt)}</span>,
      },
    ],
    actions: (a) => (
      <ActionGroup>
        {(a.status === 'PENDING' || a.status === 'UNDER_REVIEW') && (
          <>
            {btn('Approve', () => run(() => adminRentalService.approveApplication(a.id)))}
            {btn('Reject', () => run(() => adminRentalService.rejectApplication(a.id)), 'danger')}
          </>
        )}
        {(a.status === 'APPROVED' || a.status === 'REJECTED') &&
          btn('Reopen', () => run(() => adminRentalService.reopenApplication(a.id)))}
      </ActionGroup>
    ),
  };
  return <RentalQueuePage config={config} />;
}

export function ViewingsQueue() {
  const run = useQueueActions('viewings');
  const config: RentalQueueConfig<AdminRentalViewing> = {
    resource: 'viewings',
    eyebrow: 'Viewing Requests',
    title: 'Property viewings',
    description: 'Platform-wide rental viewing requests.',
    icon: CalendarClock,
    statusOptions: viewingStatusOptions,
    listFn: (params) => adminRentalService.listViewings(params),
    getRowKey: (v) => v.id,
    columns: [
      {
        key: 'property',
        header: 'Property',
        render: (v) => (
          <Cell primary={v.propertyTitle} secondary={v.unitName ?? `${v.city}, ${v.state}`} />
        ),
      },
      {
        key: 'renter',
        header: 'Renter',
        render: (v) => <Cell primary={v.renterName} secondary={v.renterEmail ?? ''} />,
      },
      {
        key: 'schedule',
        header: 'Schedule',
        render: (v) => (
          <Cell
            primary={date(v.scheduledAt) === '—' ? 'Not scheduled' : date(v.scheduledAt)}
            secondary={`Requested ${date(v.requestedAt)}`}
          />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (v) => (
          <Pill label={titleCase(v.status)} variant={viewingStatusVariant(v.status)} />
        ),
      },
    ],
    actions: (v) => (
      <ActionGroup>
        {v.status === 'REQUESTED' &&
          btn('Confirm', () => run(() => adminRentalService.confirmViewing(v.id)))}
        {v.status === 'CONFIRMED' &&
          btn('Complete', () => run(() => adminRentalService.completeViewing(v.id)))}
        {(v.status === 'REQUESTED' || v.status === 'CONFIRMED') &&
          btn('Cancel', () => run(() => adminRentalService.cancelViewing(v.id)), 'danger')}
        {(v.status === 'COMPLETED' || v.status === 'CANCELLED') && noRowActions()}
      </ActionGroup>
    ),
  };
  return <RentalQueuePage config={config} />;
}

export function LeasesQueue() {
  const run = useQueueActions('leases');
  const config: RentalQueueConfig<AdminRentalLease> = {
    resource: 'leases',
    eyebrow: 'Leases',
    title: 'Lease lifecycle',
    description: 'Platform-wide leases with audited status corrections.',
    icon: Scroll,
    statusOptions: leaseStatusOptions,
    listFn: (params) => adminRentalService.listLeases(params),
    getRowKey: (l) => l.id,
    columns: [
      {
        key: 'tenant',
        header: 'Tenant',
        render: (l) => (
          <Cell primary={l.tenantName ?? 'Manual tenant'} secondary={l.propertyTitle} />
        ),
      },
      {
        key: 'unit',
        header: 'Unit',
        render: (l) => (
          <span className="text-muted-foreground">{l.unitName ?? `${l.city}, ${l.state}`}</span>
        ),
      },
      {
        key: 'rent',
        header: 'Rent',
        render: (l) => (
          <Cell primary={naira(l.rentAmount)} secondary={`${l.paymentCount} payments`} />
        ),
      },
      {
        key: 'period',
        header: 'Period',
        render: (l) => (
          <span className="text-muted-foreground">
            {date(l.leaseStart)} → {date(l.leaseEnd)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (l) => <Pill label={titleCase(l.status)} variant={lifecycleVariant(l.status)} />,
      },
    ],
    actions: (l) => (
      <StatusCell
        current={l.status}
        options={leaseStatusOptions}
        onSave={(status) =>
          run(() => adminRentalService.updateLeaseStatus(l.id, status as RentalLeaseStatus))
        }
      />
    ),
  };
  return <RentalQueuePage config={config} />;
}

export function RenewalsQueue() {
  const run = useQueueActions('renewals');
  const config: RentalQueueConfig<AdminRentalRenewal> = {
    resource: 'renewals',
    eyebrow: 'Renewal Offers',
    title: 'Lease renewals',
    description: 'Platform-wide renewal offers with accept/decline controls.',
    icon: RefreshCw,
    statusOptions: renewalStatusOptions,
    listFn: (params) => adminRentalService.listRenewals(params),
    getRowKey: (r) => r.id,
    columns: [
      {
        key: 'offer',
        header: 'Offer',
        render: (r) => (
          <Cell
            primary={`${naira(r.newRentAmount)} (+${r.increasePercentage}%)`}
            secondary={`${r.propertyTitle} · ${r.tenantName ?? ''}`}
          />
        ),
      },
      {
        key: 'end',
        header: 'New end date',
        render: (r) => <span className="text-muted-foreground">{date(r.newEndDate)}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (r) => <Pill label={titleCase(r.status)} variant={lifecycleVariant(r.status)} />,
      },
      {
        key: 'created',
        header: 'Created',
        render: (r) => <span className="text-muted-foreground">{date(r.createdAt)}</span>,
      },
    ],
    actions: (r) => (
      <ActionGroup>
        {r.status === 'PENDING' && (
          <>
            {btn('Accept', () => run(() => adminRentalService.acceptRenewal(r.id)))}
            {btn('Decline', () => run(() => adminRentalService.declineRenewal(r.id)), 'danger')}
          </>
        )}
        {r.status !== 'PENDING' && noRowActions()}
      </ActionGroup>
    ),
  };
  return <RentalQueuePage config={config} />;
}

export function TerminationsQueue() {
  const run = useQueueActions('terminations');
  const config: RentalQueueConfig<AdminRentalTermination> = {
    resource: 'terminations',
    eyebrow: 'Termination Requests',
    title: 'Lease terminations',
    description: 'Platform-wide lease termination requests.',
    icon: FileX2,
    statusOptions: terminationStatusOptions,
    listFn: (params) => adminRentalService.listTerminations(params),
    getRowKey: (t) => t.id,
    columns: [
      {
        key: 'request',
        header: 'Request',
        render: (t) => <Cell primary={t.propertyTitle} secondary={t.unitName ?? t.city} />,
      },
      {
        key: 'parties',
        header: 'Parties',
        render: (t) => (
          <Cell
            primary={t.tenantName ?? '—'}
            secondary={`Requested by ${t.requesterName ?? '—'}`}
          />
        ),
      },
      {
        key: 'reason',
        header: 'Reason',
        render: (t) => (
          <p className="max-w-[220px] truncate text-muted-foreground" title={t.reason}>
            {t.reason}
          </p>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (t) => <Pill label={titleCase(t.status)} variant={lifecycleVariant(t.status)} />,
      },
    ],
    actions: (t) => (
      <ActionGroup>
        {t.status === 'PENDING' && (
          <>
            {btn('Approve', () => run(() => adminRentalService.approveTermination(t.id)))}
            {btn('Reject', () => run(() => adminRentalService.rejectTermination(t.id)), 'danger')}
          </>
        )}
        {t.status !== 'PENDING' && noRowActions()}
      </ActionGroup>
    ),
  };
  return <RentalQueuePage config={config} />;
}

export function EvictionsQueue() {
  const run = useQueueActions('evictions');
  const config: RentalQueueConfig<AdminRentalEviction> = {
    resource: 'evictions',
    eyebrow: 'Eviction Cases',
    title: 'Eviction cases',
    description: 'Platform-wide eviction cases with audited status corrections.',
    icon: Gavel,
    statusOptions: evictionStatusOptions,
    listFn: (params) => adminRentalService.listEvictions(params),
    getRowKey: (e) => e.id,
    columns: [
      {
        key: 'property',
        header: 'Property',
        render: (e) => <Cell primary={e.propertyTitle} secondary={e.unitName ?? e.city} />,
      },
      {
        key: 'tenant',
        header: 'Tenant',
        render: (e) => (
          <Cell primary={e.tenantName ?? '—'} secondary={`By ${e.initiatorName ?? '—'}`} />
        ),
      },
      {
        key: 'reason',
        header: 'Reason',
        render: (e) => (
          <p className="max-w-[220px] truncate text-muted-foreground" title={e.reason}>
            {e.reason}
          </p>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (e) => <Pill label={titleCase(e.status)} variant={lifecycleVariant(e.status)} />,
      },
    ],
    actions: (e) => (
      <StatusCell
        current={e.status}
        options={evictionStatusOptions}
        onSave={(status) =>
          run(() => adminRentalService.updateEvictionStatus(e.id, status as RentalEvictionStatus))
        }
      />
    ),
  };
  return <RentalQueuePage config={config} />;
}

/** Icons exported for the overview module grid. */
export const rentalModuleIcons: Record<string, LucideIcon> = {
  listings: Building2,
  applications: ClipboardList,
  viewings: CalendarClock,
  leases: Scroll,
  renewals: RefreshCw,
  terminations: FileX2,
  evictions: Gavel,
};
