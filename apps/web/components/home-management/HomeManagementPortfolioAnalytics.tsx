'use client';

import { useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/format';
import type {
  HomeAsset,
  HomeManagementProperty,
  HomeManagementWorkOrder,
} from '@/services/homeManagementService';

const CLOSED_WORK_ORDER_STATUSES = new Set<HomeManagementWorkOrder['status']>([
  'RESOLVED',
  'CANCELLED',
]);

type PortfolioMetric = {
  id: string;
  label: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
};

type PropertyRow = {
  id: string;
  label: string;
  openWorkOrders: number;
  overdueWorkOrders: number;
  approvedSpend: number;
  assetsNeedingService: number;
};

interface HomeManagementPortfolioAnalyticsProps {
  properties: HomeManagementProperty[];
  workOrders: HomeManagementWorkOrder[];
  assets: HomeAsset[];
  isLoading?: boolean;
}

const timestamp = (value?: string | null): number | null => {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const isOpenWorkOrder = (workOrder: HomeManagementWorkOrder) =>
  !CLOSED_WORK_ORDER_STATUSES.has(workOrder.status);

const workOrderDeadline = (workOrder: HomeManagementWorkOrder) =>
  workOrder.dueAt ?? workOrder.resolutionDueAt ?? workOrder.responseDueAt ?? null;

const isWorkOrderOverdue = (workOrder: HomeManagementWorkOrder, now: number) => {
  const deadline = timestamp(workOrderDeadline(workOrder));
  return isOpenWorkOrder(workOrder) && deadline !== null && deadline < now;
};

const workOrderPropertyId = (workOrder: HomeManagementWorkOrder) => workOrder.unit?.property?.id;

const propertyLabel = (property: HomeManagementProperty) =>
  property.title ?? property.name ?? 'Property';

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

/**
 * A portfolio-wide rollup of spend, SLA compliance, and asset health. It
 * reuses the properties/work-orders/assets already loaded in this workspace
 * rather than issuing a dedicated analytics request.
 */
export function HomeManagementPortfolioAnalytics({
  properties,
  workOrders,
  assets,
  isLoading = false,
}: HomeManagementPortfolioAnalyticsProps) {
  const [now] = useState(() => Date.now());
  const hasRecords = properties.length > 0;
  const showLoadingState = isLoading && !hasRecords;

  const { metrics, propertyRows } = useMemo(() => {
    const openWorkOrders = workOrders.filter(isOpenWorkOrder);
    const resolvedWorkOrders = workOrders.filter((workOrder) => workOrder.status === 'RESOLVED');
    const overdueWorkOrders = workOrders.filter((workOrder) => isWorkOrderOverdue(workOrder, now));

    const slaTrackedResolved = resolvedWorkOrders.filter(
      (workOrder) => workOrder.resolutionDueAt && workOrder.resolvedAt
    );
    const slaMetResolved = slaTrackedResolved.filter(
      (workOrder) => timestamp(workOrder.resolvedAt)! <= timestamp(workOrder.resolutionDueAt)!
    );
    const slaComplianceRate =
      slaTrackedResolved.length > 0
        ? Math.round((slaMetResolved.length / slaTrackedResolved.length) * 100)
        : null;

    const approvedSpend = workOrders.reduce(
      (total, workOrder) => total + (workOrder.approvedCost ?? 0),
      0
    );

    const assetsNeedingService = assets.filter((asset) => asset.status === 'NEEDS_SERVICE').length;

    const metrics: PortfolioMetric[] = [
      {
        id: 'open-work-orders',
        label: 'Open work orders',
        value: String(openWorkOrders.length),
        subtext: `${overdueWorkOrders.length} currently overdue`,
        icon: ClipboardList,
      },
      {
        id: 'sla-compliance',
        label: 'SLA compliance',
        value: slaComplianceRate === null ? 'N/A' : `${slaComplianceRate}%`,
        subtext:
          slaTrackedResolved.length > 0
            ? `Across ${slaTrackedResolved.length} resolved work order${
                slaTrackedResolved.length === 1 ? '' : 's'
              } with an SLA target`
            : 'No resolved work orders have SLA data yet',
        icon: ShieldCheck,
      },
      {
        id: 'approved-spend',
        label: 'Approved spend',
        value: formatCurrency(approvedSpend, { compact: true }),
        subtext: 'Across all recorded work orders',
        icon: BadgeDollarSign,
      },
      {
        id: 'assets-needing-service',
        label: 'Assets needing service',
        value: String(assetsNeedingService),
        subtext: `Out of ${assets.length} registered asset${assets.length === 1 ? '' : 's'}`,
        icon: Wrench,
      },
    ];

    const propertyRows: PropertyRow[] = properties.map((property) => {
      const propertyWorkOrders = workOrders.filter(
        (workOrder) => workOrderPropertyId(workOrder) === property.id
      );
      const propertyAssets = assets.filter((asset) => asset.propertyId === property.id);

      return {
        id: property.id,
        label: propertyLabel(property),
        openWorkOrders: propertyWorkOrders.filter(isOpenWorkOrder).length,
        overdueWorkOrders: propertyWorkOrders.filter((workOrder) =>
          isWorkOrderOverdue(workOrder, now)
        ).length,
        approvedSpend: propertyWorkOrders.reduce(
          (total, workOrder) => total + (workOrder.approvedCost ?? 0),
          0
        ),
        assetsNeedingService: propertyAssets.filter((asset) => asset.status === 'NEEDS_SERVICE')
          .length,
      };
    });

    return { metrics, propertyRows };
  }, [assets, now, properties, workOrders]);

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
          Spend, SLA compliance, and asset health computed from the operational records already in
          this workspace.
        </p>
      </div>

      {showLoadingState ? (
        <AnalyticsLoadingState />
      ) : !hasRecords ? (
        <div className="mt-5">
          <EmptyState
            icon={CheckCircle2}
            title="No properties are available for analytics yet"
            description="Add a property to begin rolling up work-order spend and SLA compliance here."
          />
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>

          <Card static hover={false} className="mt-5 overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h3 className="font-semibold text-foreground">By property</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Open work, overdue items, spend, and asset health per property.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Property</th>
                    <th className="px-5 py-3 font-medium">Open</th>
                    <th className="px-5 py-3 font-medium">Overdue</th>
                    <th className="px-5 py-3 font-medium">Approved spend</th>
                    <th className="px-5 py-3 font-medium">Assets needing service</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {propertyRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-5 py-3 font-medium text-foreground">{row.label}</td>
                      <td className="px-5 py-3 text-foreground">{row.openWorkOrders}</td>
                      <td className="px-5 py-3 text-foreground">{row.overdueWorkOrders}</td>
                      <td className="px-5 py-3 text-foreground">
                        {formatCurrency(row.approvedSpend, { compact: true })}
                      </td>
                      <td className="px-5 py-3 text-foreground">{row.assetsNeedingService}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </section>
  );
}
