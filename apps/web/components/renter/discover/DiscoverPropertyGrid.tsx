'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DiscoverPropertyCard } from './DiscoverPropertyCard';
import { VirtualTourViewerModal } from './features/VirtualTourViewerModal';
import { Property } from '@/types/renter';
import type { TourModalMode } from '@/types/virtual-tour';
import { trackRecentlyViewed } from '@/lib/mockProperties';
import { renterService } from '@/services/renterService';
import { Home } from 'lucide-react';

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
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tourProperty, setTourProperty] = useState<Property | null>(null);
  const [tourInitialMode, setTourInitialMode] = useState<TourModalMode>('tour');

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      const response = await renterService.listListings({
        search: filters.search,
        location: filters.location,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        bedrooms: filters.bedrooms,
        bathrooms: filters.bathrooms,
        propertyType: filters.propertyType,
        verifiedOnly: filters.verifiedOnly,
      });
      if (response.success && response.data) setProperties(response.data);
      setIsLoading(false);
    };

    fetchProperties();
  }, [filters]);

  const handleViewDetails = (property: Property) => {
    trackRecentlyViewed(property);
    router.push(`/renter/properties/${property.id}`);
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
    router.push(`/renter/properties/${propertyId}/apply`);
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
        initialMode={tourInitialMode}
        onClose={() => setTourProperty(null)}
      />
    </div>
  );
};
