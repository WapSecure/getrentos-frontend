'use client';

import {
  BadgeDollarSign,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Card, EmptyState, Skeleton } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import type { HomeManagementDashboard } from '@/services/homeManagementService';

type PortfolioMetric = {
  id: string;
  label: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
};

interface HomeManagementPortfolioAnalyticsProps {
  /** Server-calculated across the complete active portfolio, not list pages. */
  summary?: HomeManagementDashboard;
  isLoading?: boolean;
}

function AnalyticsLoadingState() {
  return (
    <div
      aria-label="Loading portfolio analytics"
      className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} static hover={false} className="p-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-8 w-16" />
          <Skeleton className="mt-4 h-3 w-32" />
        </Card>
      ))}
    </div>
  );
}

function MetricCard({ metric }: { metric: PortfolioMetric }) {
  const Icon = metric.icon;
  return (
    <Card static hover={false} className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">
            {metric.value}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{metric.subtext}</p>
    </Card>
  );
}

/** Exact portfolio roll-up supplied by the dedicated dashboard API summary. */
export function HomeManagementPortfolioAnalytics({
  summary,
  isLoading = false,
}: HomeManagementPortfolioAnalyticsProps) {
  const hasProperties = (summary?.propertiesTotal ?? 0) > 0;
  const metrics: PortfolioMetric[] = [
    {
      id: 'open-work-orders',
      label: 'Open work orders',
      value: String(summary?.openWorkOrders ?? 0),
      subtext: `${summary?.overdue ?? 0} currently overdue`,
      icon: ClipboardList,
    },
    {
      id: 'care-plans-due',
      label: 'Care plans due',
      value: String(summary?.plansDue ?? 0),
      subtext: 'Across all active properties',
      icon: CalendarClock,
    },
    {
      id: 'approved-spend',
      label: 'Approved spend',
      value: formatCurrency(summary?.approvedSpend ?? 0, { compact: true }),
      subtext: 'Across all recorded work orders',
      icon: BadgeDollarSign,
    },
    {
      id: 'assets-needing-service',
      label: 'Assets needing service',
      value: String(summary?.assetsNeedingService ?? 0),
      subtext: `Out of ${summary?.totalAssets ?? 0} registered asset${summary?.totalAssets === 1 ? '' : 's'}`,
      icon: Wrench,
    },
  ];

  return (
    <section aria-labelledby="portfolio-analytics-heading" className="mt-8">
      <div>
        <p className="text-sm font-medium text-primary">Portfolio analytics</p>
        <h2
          id="portfolio-analytics-heading"
          className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground"
        >
          Roll up service delivery across your portfolio.
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          These metrics are calculated server-side across the whole portfolio, independently of the
          page currently visible in each operational queue.
        </p>
      </div>

      {isLoading ? (
        <AnalyticsLoadingState />
      ) : !hasProperties ? (
        <div className="mt-5">
          <EmptyState
            icon={CheckCircle2}
            title="No properties are available for analytics yet"
            description="Add a property to begin rolling up work-order spend and asset health here."
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      )}
    </section>
  );
}
