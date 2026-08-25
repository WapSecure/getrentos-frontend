'use client';

import { Star, Users } from 'lucide-react';
import { Badge, Card, EmptyState, Skeleton } from '@getrentos/ui';
import type { HomeManagementVendor } from '@/services/homeManagementService';

interface HomeManagementVendorPerformanceProps {
  vendors: HomeManagementVendor[];
  isLoading?: boolean;
}

function VendorLoadingState() {
  return (
    <div
      aria-label="Loading vendor performance"
      className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: 3 }, (_, index) => (
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

/** Vendor directory cards intentionally use the vendor's durable profile data.
 * Current work-order workload belongs in the paginated work-order queue rather
 * than being inferred from a single page of results.
 */
export function HomeManagementVendorPerformance({
  vendors,
  isLoading = false,
}: HomeManagementVendorPerformanceProps) {
  const showLoadingState = isLoading && vendors.length === 0;

  return (
    <section aria-labelledby="vendor-performance-heading" className="mt-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-primary">Vendor network</p>
            {!showLoadingState && vendors.length > 0 && (
              <Badge variant="neutral">
                {vendors.length} vendor{vendors.length === 1 ? '' : 's'} shown
              </Badge>
            )}
          </div>
          <h2
            id="vendor-performance-heading"
            className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground"
          >
            Keep a reliable home-services directory.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Rating and delivery history come from each vendor&apos;s durable profile; use the
            work-order queue for current assignments and controlled spend.
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
            description="Add vendors from your maintenance workspace to track their rating and delivery history here."
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {vendors.map((vendor) => (
            <Card key={vendor.id} static hover={false} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{vendor.name}</p>
                  {vendor.serviceType && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{vendor.serviceType}</p>
                  )}
                </div>
                <VendorRating rating={vendor.rating} />
              </div>
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">Lifetime jobs</p>
                <p className="mt-0.5 font-semibold text-foreground">{vendor.jobsCompleted ?? 0}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
