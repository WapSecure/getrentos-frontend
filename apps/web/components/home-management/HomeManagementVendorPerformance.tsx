'use client';

import { Star, Users } from '@sureground/icons';
import { Badge, Card, EmptyState, Skeleton } from '@sureground/ui';
import { HomeManagementSectionHeading } from '@/components/home-management/HomeManagementSectionHeading';
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
      <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
      {rating.toFixed(1)}
    </div>
  );
}

// Uses the vendor's durable profile: workload belongs in the paginated queue, not inferred from one page.
export function HomeManagementVendorPerformance({
  vendors,
  isLoading = false,
}: HomeManagementVendorPerformanceProps) {
  const showLoadingState = isLoading && vendors.length === 0;

  return (
    <section aria-labelledby="vendor-performance-heading">
      <HomeManagementSectionHeading
        id="vendor-performance-heading"
        title="Vendors"
        description="Rating and completed jobs from each vendor's profile. Current assignments are on the Work orders tab."
        meta={
          !showLoadingState && vendors.length > 0 ? (
            <Badge variant="neutral">
              {vendors.length} vendor{vendors.length === 1 ? '' : 's'}
            </Badge>
          ) : undefined
        }
      />

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
