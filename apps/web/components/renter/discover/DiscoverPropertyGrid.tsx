'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { EmptyState, Pagination, Skeleton } from '@getrentos/ui';
import { DiscoverPropertyCard } from './DiscoverPropertyCard';
import { VirtualTourViewerModal } from './features/VirtualTourViewerModal';
import { Property } from '@/types/renter';
import type { TourModalMode } from '@/types/virtual-tour';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { Home } from 'lucide-react';
import { buildRoute } from '@/lib/constants/auth';

interface DiscoverPropertyGridProps {
  filters: {
    location: string;
    minPrice: string;
    maxPrice: string;
    bedrooms: string;
    bathrooms: string;
    propertyType: string;
    verifiedOnly: boolean;
    search?: string;
    /** Estate public slug: set when arriving from an estate microsite. */
    estate?: string;
  };
  savedProperties: string[];
  onSave: (id: string) => void;
  onCompare: (property: Property) => void;
}

export const DiscoverPropertyGrid = ({
  filters,
  savedProperties,
  onSave,
  onCompare,
}: DiscoverPropertyGridProps) => {
  const router = useRouter();
  const [tourProperty, setTourProperty] = useState<Property | null>(null);
  const [tourInitialMode, setTourInitialMode] = useState<TourModalMode>('tour');
  const [page, setPage] = useState(1);

  const listingsFilters = {
    search: filters.search,
    location: filters.location,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    bedrooms: filters.bedrooms,
    bathrooms: filters.bathrooms,
    propertyType: filters.propertyType,
    verifiedOnly: filters.verifiedOnly,
    estate: filters.estate,
  };

  const filtersKey = JSON.stringify(listingsFilters);
  useEffect(() => {
    // Reset to page 1 whenever the filter values change.
    const timer = setTimeout(() => setPage(1), 0);
    return () => clearTimeout(timer);
  }, [filtersKey]);

  const PAGE_SIZE = 6;

  const { data, isLoading } = useQuery({
    queryKey: renterKeys.listings({ ...listingsFilters, page, pageSize: PAGE_SIZE }),
    queryFn: () =>
      unwrap(renterService.listListings({ ...listingsFilters, page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  const properties = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleViewDetails = (property: Property) => {
    renterService.recordListingView(property.id).catch(() => {});
    router.push(buildRoute.renterPropertyDetail(property.id));
  };

  const handleScheduleViewing = (property: Property) => {
    setTourInitialMode('booking');
    setTourProperty(property);
  };

  const handleOpenTour = (property: Property) => {
    setTourInitialMode('tour');
    setTourProperty(property);
  };

  const handleApply = (propertyId: string) => {
    router.push(buildRoute.renterPropertyApply(propertyId));
  };

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading properties"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-border bg-card">
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-3/5" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <EmptyState
        icon={Home}
        title="No properties found"
        description="Try adjusting your filters to find more properties"
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {properties.map((property) => (
          <DiscoverPropertyCard
            key={property.id}
            property={property}
            isSaved={savedProperties.includes(property.id)}
            onSave={() => onSave(property.id)}
            onCompare={() => onCompare(property)}
            onViewDetails={() => handleViewDetails(property)}
            onScheduleViewing={() => handleScheduleViewing(property)}
            onApply={() => handleApply(property.id)}
            onOpenTour={() => handleOpenTour(property)}
          />
        ))}

        <VirtualTourViewerModal
          propertyTitle={tourProperty?.title || null}
          propertyId={tourProperty?.propertyId || null}
          videoTourUrl={tourProperty?.videoTourUrl}
          hostName={tourProperty?.landlordName}
          initialMode={tourInitialMode}
          onClose={() => setTourProperty(null)}
        />
      </div>

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-8"
        />
      )}
    </>
  );
};
