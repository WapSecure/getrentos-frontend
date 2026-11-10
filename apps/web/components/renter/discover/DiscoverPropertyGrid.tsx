'use client';

import { useEffect, useState } from 'react';
import { track } from '@/lib/analytics';

const event = (listingId: string, position: number) => ({
  listingId,
  market: 'rent' as const,
  surface: 'discover',
  props: { position },
});
import { useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { EmptyState, Pagination, Skeleton } from '@sureground/ui';
import { DiscoverPropertyCard } from './DiscoverPropertyCard';
import { VirtualTourViewerModal } from './features/VirtualTourViewerModal';
import { Property } from '@/types/renter';
import type { TourModalMode } from '@/types/virtual-tour';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { Home } from '@sureground/icons';
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

  const recordView = (property: Property) => {
    renterService.recordListingView(property.id).catch(() => {});
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
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2">
        {properties.map((property, index) => (
          <DiscoverPropertyCard
            key={property.id}
            property={property}
            href={buildRoute.renterPropertyDetail(property.id)}
            eager={index < 2}
            isSaved={savedProperties.includes(property.id)}
            onSave={() => {
              if (!savedProperties.includes(property.id))
                track({ name: 'property_save', ...event(property.id, index) });
              onSave(property.id);
            }}
            onCompare={() => {
              track({ name: 'property_compare', ...event(property.id, index) });
              onCompare(property);
            }}
            onOpen={() => {
              track({ name: 'property_card_click', ...event(property.id, index) });
              recordView(property);
            }}
            onVisible={() => track({ name: 'property_impression', ...event(property.id, index) })}
            onScheduleViewing={() => {
              track({ name: 'inspection_request_start', ...event(property.id, index) });
              handleScheduleViewing(property);
            }}
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
