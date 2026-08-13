'use client';

import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
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
  };

  const { data: properties = [], isLoading } = useQuery({
    queryKey: renterKeys.listings(listingsFilters),
    queryFn: () => unwrap(renterService.listListings(listingsFilters)),
  });

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
      <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-16 text-sm text-muted-foreground">
        Loading map…
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
        <MapPin className="h-8 w-8 text-muted-foreground" />
        <p className="mt-2 font-medium text-foreground">No listings match your filters</p>
        <p className="text-sm text-muted-foreground">
          Try widening your search to see them on the map.
        </p>
      </div>
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
