'use client';

import { useMemo } from 'react';
import { BadgeDollarSign, Star, Users } from 'lucide-react';
import { Badge } from '@getrentos/ui';
import { Card } from '@getrentos/ui';
import { EmptyState } from '@getrentos/ui';
import { Skeleton } from '@getrentos/ui';
import { formatCurrency } from '@/lib/format';
import type {
  HomeManagementVendor,
  HomeManagementWorkOrder,
} from '@/services/homeManagementService';

const CLOSED_WORK_ORDER_STATUSES = new Set<HomeManagementWorkOrder['status']>([
  'RESOLVED',
  'CANCELLED',
]);

type VendorScorecard = {
  vendor: HomeManagementVendor;
  openAssignments: number;
  approvedSpend: number;
};

interface HomeManagementVendorPerformanceProps {
  vendors: HomeManagementVendor[];
  workOrders: HomeManagementWorkOrder[];
  isLoading?: boolean;
}

function VendorLoadingState() {
  return (
    <div
      aria-label="Loading vendor performance"
      className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} static hover={false} className="p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-6 w-20" />
          <Skeleton className="mt-4 h-3 w-40" />
        </Card>
      ))}
    </div>
  );
}

function VendorRating({ rating }: { rating?: number }) {
  if (rating === undefined || rating === null) {
    return <span className="text-sm text-muted-foreground">Not yet rated</span>;
  }

  return (
    <div className="flex items-center gap-1 text-sm font-medium text-foreground">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
      {rating.toFixed(1)}
    </div>
  );
}

function VendorCard({ scorecard }: { scorecard: VendorScorecard }) {
  const { vendor, openAssignments, approvedSpend } = scorecard;

  return (
    <Card static hover={false} className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{vendor.name}</p>
          {vendor.serviceType && (
            <p className="mt-0.5 text-xs text-muted-foreground">{vendor.serviceType}</p>
          )}
        </div>
        <VendorRating rating={vendor.rating} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div>
          <p className="text-xs text-muted-foreground">Lifetime jobs</p>
          <p className="mt-0.5 font-semibold text-foreground">{vendor.jobsCompleted ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Open assignments</p>
          <p className="mt-0.5 font-semibold text-foreground">{openAssignments}</p>
        </div>
      </div>

      {approvedSpend > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <BadgeDollarSign className="h-3.5 w-3.5" aria-hidden="true" />
          {formatCurrency(approvedSpend, { compact: true })} approved spend in Home Management
        </div>
      )}
    </Card>
  );
}

/**
 * A landlord-only scorecard for the vendors in the contact book. It combines
 * the lifetime rating/jobs counters recorded on the vendor record with the
 * work-order records already loaded in this workspace, so it never issues a
 * second Home Management request.
 */
export function HomeManagementVendorPerformance({
  vendors,
  workOrders,
  isLoading = false,
}: HomeManagementVendorPerformanceProps) {
  const showLoadingState = isLoading && vendors.length === 0;

  const scorecards = useMemo<VendorScorecard[]>(() => {
    return vendors
      .map((vendor) => {
        const vendorWorkOrders = workOrders.filter(
          (workOrder) => workOrder.assignedVendor?.id === vendor.id
        );
        const openAssignments = vendorWorkOrders.filter(
          (workOrder) => !CLOSED_WORK_ORDER_STATUSES.has(workOrder.status)
        ).length;
        const approvedSpend = vendorWorkOrders.reduce(
          (total, workOrder) => total + (workOrder.approvedCost ?? 0),
          0
        );
        return { vendor, openAssignments, approvedSpend };
      })
      .sort((left, right) => (right.vendor.rating ?? 0) - (left.vendor.rating ?? 0));
  }, [vendors, workOrders]);

  return (
    <section aria-labelledby="vendor-performance-heading" className="mt-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-primary">Vendor network</p>
            {!showLoadingState && vendors.length > 0 && (
              <Badge variant="neutral">
                {vendors.length} vendor{vendors.length === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
          <h2
            id="vendor-performance-heading"
            className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground"
          >
            See who&apos;s delivering across your vendor network.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Rating, lifetime jobs, and current workload for every vendor in your contact book.
          </p>
        </div>
      </div>

      {showLoadingState ? (
        <VendorLoadingState />
      ) : vendors.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={Users}
            title="No vendors added yet"
            description="Add vendors from your maintenance workspace to track their rating and workload here."
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {scorecards.map((scorecard) => (
            <VendorCard key={scorecard.vendor.id} scorecard={scorecard} />
          ))}
        </div>
      )}
    </section>
  );
}
