'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  CreditCard,
  FileText,
  House,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Receipt,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import type { MaintenanceRequest, MaintenanceRequestStatus } from '@/types/maintenance';

const formatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

const formatDate = (value?: string, fallback = 'Not available') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const formatServiceTarget = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const maintenanceStatusMeta: Record<
  MaintenanceRequestStatus,
  { label: string; variant: BadgeVariant }
> = {
  submitted: { label: 'Submitted', variant: 'info' },
  assigned: { label: 'Assigned', variant: 'info' },
  in_progress: { label: 'In progress', variant: 'warning' },
  resolved: { label: 'Resolved', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
};

const priorityVariant: Record<MaintenanceRequest['priority'], BadgeVariant> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

const quickActions = [
  {
    title: 'Report an issue',
    description: 'Create and track a repair request.',
    href: ROUTES.RENTER_MAINTENANCE,
    icon: Wrench,
  },
  {
    title: 'Lease & records',
    description: 'Review your agreement and stored documents.',
    href: ROUTES.RENTER_LEASE,
    icon: FileText,
  },
  {
    title: 'Payments',
    description: 'See rent due dates and payment history.',
    href: ROUTES.RENTER_PAYMENTS,
    icon: CreditCard,
  },
  {
    title: 'Home calendar',
    description: 'Keep viewings, payments, and home visits organised.',
    href: ROUTES.RENTER_CALENDAR,
    icon: CalendarDays,
  },
];

export default function RenterHomePage() {
  const leaseQuery = useQuery({
    queryKey: renterKeys.lease,
    queryFn: () => unwrap(renterService.getLease()),
  });
  const maintenanceQuery = useQuery({
    queryKey: renterKeys.maintenanceRequests,
    queryFn: () => unwrap(renterService.listMaintenanceRequests()),
  });
  const documentsQuery = useQuery({
    queryKey: renterKeys.documents,
    queryFn: () => unwrap(renterService.listDocuments()),
  });
  const remindersQuery = useQuery({
    queryKey: renterKeys.upcomingPaymentReminders,
    queryFn: () => unwrap(renterService.getUpcomingPaymentReminders()),
  });

  const lease = leaseQuery.data;
  const maintenanceRequests = maintenanceQuery.data ?? [];
  const documents = documentsQuery.data ?? [];
  const paymentReminders = remindersQuery.data ?? [];

  const openRequests = useMemo(
    () =>
      maintenanceRequests
        .filter((request) => request.status !== 'resolved' && request.status !== 'cancelled')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [maintenanceRequests]
  );
  const urgentRequests = openRequests.filter(
    (request) => request.priority === 'urgent' || request.priority === 'high'
  );
  const emergencyRequests = openRequests.filter((request) => request.isEmergency);
  const expiringDocuments = documents.filter((document) => document.status === 'expiring');
  const nextPayment = useMemo(
    () =>
      [...paymentReminders].sort(
        (a, b) => a.daysRemaining - b.daysRemaining || a.dueDate.localeCompare(b.dueDate)
      )[0],
    [paymentReminders]
  );
  const isLoading =
    leaseQuery.isLoading ||
    maintenanceQuery.isLoading ||
    documentsQuery.isLoading ||
    remindersQuery.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading home information">
        <div className="h-44 animate-pulse rounded-3xl bg-secondary" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
          <House className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-foreground">My Home</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Once a lease is active, this is where you will manage repairs, records, payments, and
          communication for your home.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button href={ROUTES.RENTER_DISCOVER} rounded="lg">
            Explore homes
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href={ROUTES.RENTER_APPLICATIONS} variant="outline" rounded="lg">
            View applications
          </Button>
        </div>
      </div>
    );
  }

  const hasDataError = maintenanceQuery.isError || documentsQuery.isError || remindersQuery.isError;

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:px-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <House className="h-5 w-5" />
              </span>
              <Badge variant="success" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
                Active home
              </Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
              {lease.propertyName}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground sm:text-base">
              <MapPin className="h-4 w-4 shrink-0" />
              {lease.address}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
              Your operational record for this home—repairs, lease documents, payments, and the
              people supporting you.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              href={ROUTES.RENTER_MAINTENANCE}
              rounded="lg"
              icon={<Wrench className="h-4 w-4" />}
            >
              Report an issue
            </Button>
            <Button href={ROUTES.RENTER_LEASE} variant="outline" rounded="lg">
              View lease
            </Button>
          </div>
        </div>
      </section>

      {hasDataError && (
        <div className="flex gap-3 rounded-2xl border border-warning/30 bg-warning-subtle px-4 py-3 text-sm text-foreground">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            Some home information could not be refreshed. Your available records are still shown.
          </p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SnapshotCard
          label="Open care requests"
          value={openRequests.length}
          detail={
            emergencyRequests.length
              ? `${emergencyRequests.length} emergency ${emergencyRequests.length === 1 ? 'request' : 'requests'}`
              : urgentRequests.length
                ? `${urgentRequests.length} high priority`
                : 'Nothing high priority'
          }
          icon={Wrench}
          tone="amber"
        />
        <SnapshotCard
          label="Home records"
          value={documents.length}
          detail={
            expiringDocuments.length
              ? `${expiringDocuments.length} need review`
              : 'All records are current'
          }
          icon={FileText}
          tone="blue"
        />
        <SnapshotCard
          label="Next rent"
          value={nextPayment ? formatter.format(nextPayment.amount) : '—'}
          detail={nextPayment ? `Due ${formatDate(nextPayment.dueDate)}` : 'No upcoming payment'}
          icon={Receipt}
          tone="green"
          valueClassName={nextPayment ? 'text-xl' : undefined}
        />
        <SnapshotCard
          label="Lease term"
          value={formatDate(lease.endDate, '—')}
          detail="Current lease end date"
          icon={CalendarDays}
          tone="violet"
          valueClassName="text-xl"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <Card static hover={false} className="xl:col-span-3">
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                Home care
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Live status of your repair requests.
              </p>
            </div>
            <Button href={ROUTES.RENTER_MAINTENANCE} variant="ghost" size="sm" rounded="lg">
              View all
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {openRequests.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
              <h3 className="mt-3 font-medium text-foreground">No open home-care requests</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Report an issue here whenever your home needs attention.
              </p>
              <Button
                href={ROUTES.RENTER_MAINTENANCE}
                variant="outline"
                size="sm"
                rounded="lg"
                className="mt-4"
              >
                Report an issue
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {openRequests.slice(0, 4).map((request) => {
                const status = maintenanceStatusMeta[request.status];
                const serviceTarget = formatServiceTarget(
                  request.acknowledgedAt ? request.resolutionDueAt : request.responseDueAt
                );
                return (
                  <Link
                    key={request.id}
                    href={ROUTES.RENTER_MAINTENANCE}
                    className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/60 sm:px-6"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        request.isEmergency
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                          : 'bg-warning-subtle text-warning'
                      }`}
                    >
                      <Wrench className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {request.title}
                        </span>
                        {request.isEmergency && (
                          <Badge variant="danger" icon={<CircleAlert className="h-3 w-3" />}>
                            Emergency
                          </Badge>
                        )}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Updated {formatDate(request.updatedAt)}
                        {request.assignedVendorName ? ` · ${request.assignedVendorName}` : ''}
                      </span>
                      {request.isEmergency && (
                        <span
                          className={`mt-1 block text-xs font-medium ${
                            request.acknowledgedAt
                              ? 'text-success'
                              : 'text-red-700 dark:text-red-300'
                          }`}
                        >
                          {request.acknowledgedAt ? 'Acknowledged' : 'Awaiting acknowledgement'}
                          {serviceTarget
                            ? ` · ${request.acknowledgedAt ? 'Resolution' : 'Response'} target ${serviceTarget}`
                            : ''}
                        </span>
                      )}
                    </span>
                    <span className="hidden items-center gap-2 sm:flex">
                      <Badge variant={priorityVariant[request.priority]}>{request.priority}</Badge>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <Card static hover={false} className="xl:col-span-2">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
              Your home team
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Contact your landlord about this lease.
            </p>
          </div>
          <div className="space-y-5 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
                {lease.landlord.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {lease.landlord.name}
                </p>
                <p className="text-xs text-muted-foreground">Landlord</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {lease.landlord.phone && (
                <a
                  href={`tel:${lease.landlord.phone}`}
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
                >
                  <Phone className="h-4 w-4 text-primary" />
                  Call landlord
                </a>
              )}
              {lease.landlord.email && (
                <a
                  href={`mailto:${lease.landlord.email}`}
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  Email landlord
                </a>
              )}
              <Button
                href={ROUTES.RENTER_MESSAGES}
                variant="outline"
                size="sm"
                rounded="lg"
                className="justify-start"
              >
                <MessageCircle className="h-4 w-4" />
                Open messages
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.025em] text-foreground">
              Manage your home
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the existing secure workflows for every home task.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary transition-transform group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="mt-5 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-foreground">{action.title}</h3>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card static hover={false}>
          <div className="flex items-center gap-3 border-b border-border px-5 py-4 sm:px-6">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold text-foreground">Records to review</h2>
              <p className="text-sm text-muted-foreground">
                Lease files, receipts, and home documents.
              </p>
            </div>
          </div>
          <div className="px-5 py-5 sm:px-6">
            {expiringDocuments.length > 0 ? (
              <>
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{expiringDocuments.length}</span>{' '}
                  {expiringDocuments.length === 1 ? 'document needs' : 'documents need'} review.
                </p>
                <Button
                  href={ROUTES.RENTER_DOCUMENTS}
                  variant="outline"
                  size="sm"
                  rounded="lg"
                  className="mt-4"
                >
                  Review documents
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  No document reviews are currently due.
                </p>
                <Button
                  href={ROUTES.RENTER_DOCUMENTS}
                  variant="ghost"
                  size="sm"
                  rounded="lg"
                  className="mt-4"
                >
                  Open documents
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </Card>

        <Card static hover={false}>
          <div className="flex items-center gap-3 border-b border-border px-5 py-4 sm:px-6">
            <Clock3 className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold text-foreground">Upcoming</h2>
              <p className="text-sm text-muted-foreground">Your next payment or lease milestone.</p>
            </div>
          </div>
          <div className="px-5 py-5 sm:px-6">
            {nextPayment ? (
              <>
                <p className="text-sm font-medium text-foreground">
                  {formatter.format(nextPayment.amount)} due {formatDate(nextPayment.dueDate)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {nextPayment.daysRemaining <= 0
                    ? 'This payment is now due.'
                    : `${nextPayment.daysRemaining} day${nextPayment.daysRemaining === 1 ? '' : 's'} remaining.`}
                </p>
                <Button
                  href={ROUTES.RENTER_PAYMENTS}
                  variant="outline"
                  size="sm"
                  rounded="lg"
                  className="mt-4"
                >
                  Review payment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  No upcoming payment is recorded at the moment.
                </p>
                <Button
                  href={ROUTES.RENTER_LEASE}
                  variant="ghost"
                  size="sm"
                  rounded="lg"
                  className="mt-4"
                >
                  View lease schedule
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

function SnapshotCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  valueClassName,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Wrench;
  tone: 'amber' | 'blue' | 'green' | 'violet';
  valueClassName?: string;
}) {
  const tones = {
    amber: 'bg-warning-subtle text-warning',
    blue: 'bg-accent text-primary',
    green: 'bg-success-subtle text-success',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300',
  };

  return (
    <Card static hover={false} className="p-5">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-5 text-sm font-medium text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground ${valueClassName ?? ''}`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </Card>
  );
}
