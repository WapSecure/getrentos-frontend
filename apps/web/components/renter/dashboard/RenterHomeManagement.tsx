'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, FileText, House, Wrench } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { Badge } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';

const formatShortDate = (value?: string) => {
  if (!value) return 'Not scheduled';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

/**
 * A live dashboard entry for the renter's operational home record. It deliberately
 * links to the existing lease, maintenance, document, and payment workflows instead
 * of maintaining a second client-side "home management" data model.
 */
export const RenterHomeManagement = () => {
  const { data: lease } = useQuery({
    queryKey: renterKeys.lease,
    queryFn: () => unwrap(renterService.getLease()),
  });
  const { data: requestsData } = useQuery({
    queryKey: [...renterKeys.maintenanceRequests, { page: 1, pageSize: 10 }],
    queryFn: () => unwrap(renterService.listMaintenanceRequests({ page: 1, pageSize: 10 })),
  });
  const { data: documentsData } = useQuery({
    queryKey: [...renterKeys.documents, { page: 1, pageSize: 10 }],
    queryFn: () => unwrap(renterService.listDocuments({ page: 1, pageSize: 10 })),
  });

  const requests = requestsData?.items ?? [];
  const documents = documentsData?.items ?? [];

  const openRequests = requests.filter(
    (request) => request.status !== 'resolved' && request.status !== 'cancelled'
  );
  const expiringDocuments = documents.filter((document) => document.status === 'expiring');

  if (!lease) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <House className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">My Home</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Your home record will appear here once you have an active lease.
            </p>
            <Button
              href={ROUTES.RENTER_DISCOVER}
              variant="outline"
              size="sm"
              className="mt-4"
              rounded="lg"
            >
              Find a home
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="border-b border-border bg-linear-to-br from-accent/80 via-card to-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <House className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                  My Home
                </h2>
                <p className="truncate text-sm text-muted-foreground">{lease.propertyName}</p>
              </div>
            </div>
          </div>
          <Badge variant="success">Active lease</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
        <div className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wrench className="h-4 w-4" />
            <span className="text-xs font-medium">Open care</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
            {openRequests.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {openRequests.length === 1 ? 'request needs attention' : 'requests need attention'}
          </p>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium">Home records</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
            {documentsData?.total ?? documents.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {expiringDocuments.length > 0
              ? `${expiringDocuments.length} need review`
              : 'documents securely stored'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-muted-foreground">
          Lease ends{' '}
          <span className="font-medium text-foreground">{formatShortDate(lease.endDate)}</span>
        </p>
        <Button href={ROUTES.RENTER_HOME} variant="ghost" size="sm" rounded="lg">
          Open My Home
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};
