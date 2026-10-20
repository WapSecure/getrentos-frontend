'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { EmptyState, Skeleton } from '@getrentos/ui';
import { PropertyMap, type MapMarker } from '@/components/maps/PropertyMap';
import { formatPrice, type Property } from '@/types/renter';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { buildRoute } from '@/lib/constants/auth';

interface DiscoverFilters {
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
}

interface DiscoverMapViewProps {
  filters: DiscoverFilters;
}

/** Keyless OpenStreetMap view of the filtered rental listings. */
export const DiscoverMapView = ({ filters }: DiscoverMapViewProps) => {
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

  const { data, isLoading } = useQuery({
    queryKey: renterKeys.listings({ ...listingsFilters, pageSize: 100 }),
    queryFn: () => unwrap(renterService.listListings({ ...listingsFilters, pageSize: 100 })),
    placeholderData: keepPreviousData,
  });
  const properties = data?.items ?? [];

  const markers: MapMarker[] = properties
    .filter((p: Property) => p.latitude != null && p.longitude != null)
    .map((p) => ({
      id: p.id,
      latitude: p.latitude as number,
      longitude: p.longitude as number,
      title: p.title,
      priceLabel: formatPrice(p.price, p.period),
      imageUrl: p.image || undefined,
      href: buildRoute.renterPropertyDetail(p.id),
    }));

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading map" className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-[560px] w-full rounded-2xl" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No listings match your filters"
        description="Try widening your search to see them on the map."
      />
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {markers.length === properties.length
          ? `${properties.length} listing${properties.length === 1 ? '' : 's'} on the map`
          : `${markers.length} of ${properties.length} listings plotted (the rest are awaiting map coordinates)`}
      </p>
      <PropertyMap markers={markers} height={560} />
    </div>
  );
};
