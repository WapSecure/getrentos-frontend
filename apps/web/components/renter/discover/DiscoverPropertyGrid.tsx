'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Pagination } from '@getrentos/ui';
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
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <Home className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-foreground">No properties found</h3>
        <p className="text-muted-foreground mt-1">
          Try adjusting your filters to find more properties
        </p>
      </div>
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
