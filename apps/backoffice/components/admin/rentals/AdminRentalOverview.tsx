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
import { PageErrorState, PageLoadingState, StatCard } from '@getrentos/ui';
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

  if (isError) {
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
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-accent/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
          <Landmark className="h-3 w-3" />
          Rentals
        </span>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
          Long-term rental oversight
        </h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Platform-wide listings, applications, viewings, leases and lifecycle cases.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Building2}
          label="Total listings"
          value={stats.totalListings}
          accent="blue"
          delay={0}
        />
        <StatCard
          icon={Landmark}
          label="Published"
          value={stats.publishedListings}
          accent="green"
          delay={0.05}
        />
        <StatCard
          icon={ClipboardList}
          label="Pending verification"
          value={stats.pendingVerification}
          accent="orange"
          delay={0.1}
        />
        <StatCard
          icon={Scroll}
          label="Paused / closed"
          value={stats.pausedListings + stats.closedListings}
          accent="red"
          delay={0.15}
        />
        <StatCard
          icon={FileX2}
          label="Open applications"
          value={stats.openApplications}
          accent="purple"
          delay={0.2}
        />
        <StatCard
          icon={Gavel}
          label="Active leases"
          value={stats.activeLeases}
          accent="primary"
          delay={0.25}
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
            <Link
              key={module.href}
              href={module.href}
              className="group flex items-center gap-3 rounded-xl border border-border/90 bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary transition-transform duration-300 group-hover:scale-105">
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
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
