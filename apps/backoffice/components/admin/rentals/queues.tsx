'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  Badge,
  type BadgeVariant,
  Button,
  ConfirmDialog,
  Select,
  Toast,
  type SelectOption,
} from '@getrentos/ui';
import { ApiError, unwrap } from '@getrentos/shared';
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

interface RentalAction {
  key: string;
  title: string;
  description: string;
  confirmLabel: string;
  successMessage: string;
  reasonRequired?: boolean;
  run: (reason?: string) => Promise<ApiResponse<unknown>>;
}

function useQueueActions() {
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<RentalAction | null>(null);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  );

  const executeAction = async () => {
    if (!pendingAction || processingKey) return;
    const action = pendingAction;
    setPendingAction(null);
    setProcessingKey(action.key);
    try {
      await unwrap(action.run(reason.trim() || undefined));
      setToast({ message: action.successMessage, variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'rentals'] });
    } catch (error) {
      setToast({
        message:
          error instanceof ApiError
            ? error.message
            : 'The rental action could not be completed. Please try again.',
        variant: 'error',
      });
    } finally {
      setProcessingKey(null);
    }
  };

  const feedback = (
    <>
      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
            setReason('');
          }
        }}
        title={pendingAction?.title ?? 'Confirm rental action'}
        description={pendingAction?.description ?? ''}
        confirmLabel={pendingAction?.confirmLabel ?? 'Confirm'}
        onConfirm={() => void executeAction()}
        promptLabel={pendingAction?.reasonRequired ? 'Reason' : undefined}
        promptPlaceholder="Explain the decision for other administrators…"
        promptValue={reason}
        onPromptChange={setReason}
        promptRequired={pendingAction?.reasonRequired}
        promptMinLength={10}
      />
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );

  return { request: setPendingAction, processingKey, feedback };
}

/** Inline status editor used for lease and eviction lifecycle correction. */
function StatusCell({
  current,
  options,
  onSave,
  isLoading,
  disabled,
}: {
  current: string;
  options: { value: string; label: string }[];
  onSave: (status: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(current);
  const selectOptions: SelectOption[] = options.map((o) => ({ value: o.value, label: o.label }));
  return (
    <div className="flex items-center gap-2">
      <div className="w-40">
        <Select
          value={value}
          onValueChange={setValue}
          options={selectOptions}
          ariaLabel="Status"
          disabled={disabled}
        />
      </div>
      {value !== current && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onSave(value)}
          isLoading={isLoading}
          disabled={disabled}
        >
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
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' = 'outline',
  isLoading = false,
  disabled = false
) => (
  <Button
    type="button"
    size="xs"
    variant={variant}
    onClick={onClick}
    isLoading={isLoading}
    disabled={disabled}
  >
    {label}
  </Button>
);

const noRowActions = () => null;

function ActionGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1.5">{children}</div>;
}

export function ListingsQueue() {
  const actions = useQueueActions();
  const request = (
    listing: AdminRentalListing,
    verb: 'pause' | 'flag' | 'resume' | 'close' | 'approve'
  ) => {
    const copy = {
      pause: [
        'Pause listing?',
        'The listing will be hidden from renters until it is resumed.',
        'Pause',
        'Listing paused.',
      ],
      flag: [
        'Flag listing for review?',
        'The listing will be removed from publication and returned to verification.',
        'Flag listing',
        'Listing moved to verification.',
      ],
      resume: [
        'Resume listing?',
        'The listing will become visible to renters again.',
        'Resume',
        'Listing resumed.',
      ],
      close: [
        'Close listing?',
        'The listing will be permanently closed and removed from active inventory.',
        'Close listing',
        'Listing closed.',
      ],
      approve: [
        'Approve listing?',
        'The listing will be published and become visible to renters.',
        'Approve',
        'Listing approved and published.',
      ],
    }[verb];
    const calls = {
      pause: () => adminRentalService.pauseListing(listing.id),
      flag: () => adminRentalService.flagListing(listing.id),
      resume: () => adminRentalService.resumeListing(listing.id),
      close: () => adminRentalService.closeListing(listing.id),
      approve: () => adminRentalService.approveListing(listing.id),
    };
    actions.request({
      key: `${verb}:${listing.id}`,
      title: copy[0],
      description: `${listing.title}: ${copy[1]}`,
      confirmLabel: copy[2],
      successMessage: `${listing.title}: ${copy[3]}`,
      run: calls[verb],
    });
  };
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
          btn(
            'Pause',
            () => request(l, 'pause'),
            'outline',
            actions.processingKey === `pause:${l.id}`,
            actions.processingKey !== null
          )}
        {l.status === 'PUBLISHED' &&
          btn(
            'Flag',
            () => request(l, 'flag'),
            'ghost',
            actions.processingKey === `flag:${l.id}`,
            actions.processingKey !== null
          )}
        {l.status === 'PAUSED' &&
          btn(
            'Resume',
            () => request(l, 'resume'),
            'outline',
            actions.processingKey === `resume:${l.id}`,
            actions.processingKey !== null
          )}
        {l.status === 'PAUSED' &&
          btn(
            'Close',
            () => request(l, 'close'),
            'danger',
            actions.processingKey === `close:${l.id}`,
            actions.processingKey !== null
          )}
        {l.status === 'PENDING_VERIFICATION' &&
          btn(
            'Approve',
            () => request(l, 'approve'),
            'outline',
            actions.processingKey === `approve:${l.id}`,
            actions.processingKey !== null
          )}
        {l.status === 'PENDING_VERIFICATION' &&
          btn(
            'Close',
            () => request(l, 'close'),
            'danger',
            actions.processingKey === `close:${l.id}`,
            actions.processingKey !== null
          )}
        {l.status === 'DRAFT' &&
          btn(
            'Close',
            () => request(l, 'close'),
            'danger',
            actions.processingKey === `close:${l.id}`,
            actions.processingKey !== null
          )}
      </ActionGroup>
    ),
  };
  return (
    <>
      <RentalQueuePage config={config} />
      {actions.feedback}
    </>
  );
}

export function ApplicationsQueue() {
  const actions = useQueueActions();
  const request = (application: AdminRentalApplication, verb: 'approve' | 'reject' | 'reopen') => {
    const calls = {
      approve: () => adminRentalService.approveApplication(application.id),
      reject: (reason?: string) => adminRentalService.rejectApplication(application.id, reason),
      reopen: () => adminRentalService.reopenApplication(application.id),
    };
    const labels = {
      approve: 'Approve application',
      reject: 'Reject application',
      reopen: 'Reopen application',
    };
    actions.request({
      key: `${verb}:${application.id}`,
      title: `${labels[verb]}?`,
      description: `${application.applicantName}'s application for ${application.propertyTitle} will be marked ${verb === 'reopen' ? 'under review' : verb === 'approve' ? 'approved' : 'rejected'}.`,
      confirmLabel: labels[verb],
      successMessage: `${application.applicantName}'s application was ${
        verb === 'reopen' ? 'reopened' : verb === 'approve' ? 'approved' : 'rejected'
      }.`,
      reasonRequired: verb === 'reject',
      run: calls[verb],
    });
  };
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
            {btn(
              'Approve',
              () => request(a, 'approve'),
              'outline',
              actions.processingKey === `approve:${a.id}`,
              actions.processingKey !== null
            )}
            {btn(
              'Reject',
              () => request(a, 'reject'),
              'danger',
              actions.processingKey === `reject:${a.id}`,
              actions.processingKey !== null
            )}
          </>
        )}
        {(a.status === 'APPROVED' || a.status === 'REJECTED') &&
          btn(
            'Reopen',
            () => request(a, 'reopen'),
            'outline',
            actions.processingKey === `reopen:${a.id}`,
            actions.processingKey !== null
          )}
      </ActionGroup>
    ),
  };
  return (
    <>
      <RentalQueuePage config={config} />
      {actions.feedback}
    </>
  );
}

export function ViewingsQueue() {
  const actions = useQueueActions();
  const request = (viewing: AdminRentalViewing, verb: 'confirm' | 'complete' | 'cancel') => {
    const calls = {
      confirm: () => adminRentalService.confirmViewing(viewing.id),
      complete: () => adminRentalService.completeViewing(viewing.id),
      cancel: () => adminRentalService.cancelViewing(viewing.id),
    };
    actions.request({
      key: `${verb}:${viewing.id}`,
      title: `${titleCase(verb)} viewing?`,
      description: `The viewing for ${viewing.propertyTitle} with ${viewing.renterName} will be marked ${verb === 'confirm' ? 'confirmed' : verb === 'complete' ? 'completed' : 'cancelled'}.`,
      confirmLabel: `${titleCase(verb)} viewing`,
      successMessage: `Viewing for ${viewing.propertyTitle} was ${verb === 'confirm' ? 'confirmed' : verb === 'complete' ? 'completed' : 'cancelled'}.`,
      run: calls[verb],
    });
  };
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
          btn(
            'Confirm',
            () => request(v, 'confirm'),
            'outline',
            actions.processingKey === `confirm:${v.id}`,
            actions.processingKey !== null
          )}
        {v.status === 'CONFIRMED' &&
          btn(
            'Complete',
            () => request(v, 'complete'),
            'outline',
            actions.processingKey === `complete:${v.id}`,
            actions.processingKey !== null
          )}
        {(v.status === 'REQUESTED' || v.status === 'CONFIRMED') &&
          btn(
            'Cancel',
            () => request(v, 'cancel'),
            'danger',
            actions.processingKey === `cancel:${v.id}`,
            actions.processingKey !== null
          )}
        {(v.status === 'COMPLETED' || v.status === 'CANCELLED') && noRowActions()}
      </ActionGroup>
    ),
  };
  return (
    <>
      <RentalQueuePage config={config} />
      {actions.feedback}
    </>
  );
}

export function LeasesQueue() {
  const actions = useQueueActions();
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
        key={`${l.id}:${l.status}`}
        current={l.status}
        options={leaseStatusOptions}
        onSave={(status) =>
          actions.request({
            key: `status:${l.id}`,
            title: 'Change lease status?',
            description: `${l.propertyTitle} for ${l.tenantName ?? 'the tenant'} will change from ${titleCase(l.status)} to ${titleCase(status)}. This administrative correction is audited.`,
            confirmLabel: 'Change status',
            successMessage: `Lease status changed to ${titleCase(status)}.`,
            run: () => adminRentalService.updateLeaseStatus(l.id, status as RentalLeaseStatus),
          })
        }
        isLoading={actions.processingKey === `status:${l.id}`}
        disabled={actions.processingKey !== null}
      />
    ),
  };
  return (
    <>
      <RentalQueuePage config={config} />
      {actions.feedback}
    </>
  );
}

export function RenewalsQueue() {
  const actions = useQueueActions();
  const request = (renewal: AdminRentalRenewal, verb: 'accept' | 'decline') =>
    actions.request({
      key: `${verb}:${renewal.id}`,
      title: `${titleCase(verb)} renewal?`,
      description: `The renewal for ${renewal.propertyTitle} at ${naira(renewal.newRentAmount)} will be marked ${verb === 'accept' ? 'accepted' : 'declined'}.`,
      confirmLabel: `${titleCase(verb)} renewal`,
      successMessage: `Renewal for ${renewal.propertyTitle} was ${verb === 'accept' ? 'accepted' : 'declined'}.`,
      run: () =>
        verb === 'accept'
          ? adminRentalService.acceptRenewal(renewal.id)
          : adminRentalService.declineRenewal(renewal.id),
    });
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
            {btn(
              'Accept',
              () => request(r, 'accept'),
              'outline',
              actions.processingKey === `accept:${r.id}`,
              actions.processingKey !== null
            )}
            {btn(
              'Decline',
              () => request(r, 'decline'),
              'danger',
              actions.processingKey === `decline:${r.id}`,
              actions.processingKey !== null
            )}
          </>
        )}
        {r.status !== 'PENDING' && noRowActions()}
      </ActionGroup>
    ),
  };
  return (
    <>
      <RentalQueuePage config={config} />
      {actions.feedback}
    </>
  );
}

export function TerminationsQueue() {
  const actions = useQueueActions();
  const request = (termination: AdminRentalTermination, verb: 'approve' | 'reject') =>
    actions.request({
      key: `${verb}:${termination.id}`,
      title: `${titleCase(verb)} termination?`,
      description: `The termination request for ${termination.propertyTitle} involving ${termination.tenantName ?? 'the tenant'} will be marked ${verb === 'approve' ? 'approved' : 'rejected'}.`,
      confirmLabel: `${titleCase(verb)} termination`,
      successMessage: `Termination request for ${termination.propertyTitle} was ${verb === 'approve' ? 'approved' : 'rejected'}.`,
      run: () =>
        verb === 'approve'
          ? adminRentalService.approveTermination(termination.id)
          : adminRentalService.rejectTermination(termination.id),
    });
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
            {btn(
              'Approve',
              () => request(t, 'approve'),
              'outline',
              actions.processingKey === `approve:${t.id}`,
              actions.processingKey !== null
            )}
            {btn(
              'Reject',
              () => request(t, 'reject'),
              'danger',
              actions.processingKey === `reject:${t.id}`,
              actions.processingKey !== null
            )}
          </>
        )}
        {t.status !== 'PENDING' && noRowActions()}
      </ActionGroup>
    ),
  };
  return (
    <>
      <RentalQueuePage config={config} />
      {actions.feedback}
    </>
  );
}

export function EvictionsQueue() {
  const actions = useQueueActions();
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
        key={`${e.id}:${e.status}`}
        current={e.status}
        options={evictionStatusOptions}
        onSave={(status) =>
          actions.request({
            key: `status:${e.id}`,
            title: 'Change eviction status?',
            description: `The case for ${e.propertyTitle} involving ${e.tenantName ?? 'the tenant'} will change from ${titleCase(e.status)} to ${titleCase(status)}. This legal-lifecycle correction is audited.`,
            confirmLabel: 'Change status',
            successMessage: `Eviction case status changed to ${titleCase(status)}.`,
            run: () =>
              adminRentalService.updateEvictionStatus(e.id, status as RentalEvictionStatus),
          })
        }
        isLoading={actions.processingKey === `status:${e.id}`}
        disabled={actions.processingKey !== null}
      />
    ),
  };
  return (
    <>
      <RentalQueuePage config={config} />
      {actions.feedback}
    </>
  );
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
