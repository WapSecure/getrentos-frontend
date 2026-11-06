'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  ClipboardList,
  CalendarClock,
  Scroll,
  RefreshCw,
  FileX2,
  Gavel,
  Landmark,
} from 'lucide-react';
import { Card, PageErrorState, PageHeader, PageLoadingState, StatCard } from '@getrentos/ui';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import { adminRentalService } from '@/services/adminRentalService';
import type { AdminRentalOverview } from '@/types/rental';

const EMPTY: AdminRentalOverview = {
  totalListings: 0,
  publishedListings: 0,
  pendingVerification: 0,
  pausedListings: 0,
  closedListings: 0,
  openApplications: 0,
  activeLeases: 0,
};

const modules = [
  {
    label: 'Units & tenants',
    description: 'Occupancy, pricing and bulk charges',
    href: '/admin/rentals/units',
    icon: Landmark,
  },
  {
    label: 'Listings',
    description: 'Long-term RENT/SALE listings',
    href: '/admin/rentals/listings',
    icon: Building2,
  },
  {
    label: 'Applications',
    description: 'Rental application triage',
    href: '/admin/rentals/applications',
    icon: ClipboardList,
  },
  {
    label: 'Viewings',
    description: 'Viewing requests',
    href: '/admin/rentals/viewings',
    icon: CalendarClock,
  },
  { label: 'Leases', description: 'Lease lifecycle', href: '/admin/rentals/leases', icon: Scroll },
  {
    label: 'Renewals',
    description: 'Renewal offers',
    href: '/admin/rentals/renewals',
    icon: RefreshCw,
  },
  {
    label: 'Terminations',
    description: 'Termination requests',
    href: '/admin/rentals/terminations',
    icon: FileX2,
  },
  {
    label: 'Evictions',
    description: 'Eviction cases',
    href: '/admin/rentals/evictions',
    icon: Gavel,
  },
] as const;

export const AdminRentalsOverview = () => {
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: adminKeys.rentalOverview,
    queryFn: () => unwrap(adminRentalService.overview()),
  });

  if (isLoading) return <PageLoadingState />;

  if (isError && !data) {
    return (
      <PageErrorState
        title="Could not load rental oversight"
        description="Listing and lease totals are temporarily unavailable. No operational totals are being estimated."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const stats = data ?? EMPTY;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Long-term rental operations"
        description="Listings, applications, viewings, leases, renewals, terminations, and eviction cases."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          icon={Building2}
          label="Total listings"
          value={stats.totalListings}
          accent="blue"
          compact
        />
        <StatCard
          icon={Landmark}
          label="Published"
          value={stats.publishedListings}
          accent="green"
          compact
        />
        <StatCard
          icon={ClipboardList}
          label="Pending verification"
          value={stats.pendingVerification}
          accent="orange"
          compact
        />
        <StatCard
          icon={Scroll}
          label="Paused / closed"
          value={stats.pausedListings + stats.closedListings}
          accent="red"
          compact
        />
        <StatCard
          icon={FileX2}
          label="Open applications"
          value={stats.openApplications}
          accent="purple"
          compact
        />
        <StatCard
          icon={Gavel}
          label="Active leases"
          value={stats.activeLeases}
          accent="primary"
          compact
        />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.01em] text-foreground">
            Management queues
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Review and intervene across the rental lifecycle.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((module) => (
            <Card key={module.href} interactive>
              <Link href={module.href} className="group flex items-center gap-3 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <module.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {module.label}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {module.description}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
