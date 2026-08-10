'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DiscoverPropertyCard } from './DiscoverPropertyCard';
import { VirtualTourViewerModal } from './features/VirtualTourViewerModal';
import { Property } from '@/types/renter';
import type { TourModalMode } from '@/types/virtual-tour';
import { mockProperties, trackRecentlyViewed } from '@/lib/mockProperties';
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
  const [properties, setProperties] = useState(mockProperties);
  const [isLoading, setIsLoading] = useState(false);
  const [tourProperty, setTourProperty] = useState<Property | null>(null);
  const [tourInitialMode, setTourInitialMode] = useState<TourModalMode>('tour');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setTimeout(() => {
      let filtered = [...mockProperties];

      if (filters.search) {
        const query = filters.search.toLowerCase();
        filtered = filtered.filter(
          (p) => p.title.toLowerCase().includes(query) || p.location.toLowerCase().includes(query)
        );
      }
      if (filters.location) {
        filtered = filtered.filter((p) =>
          p.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }
      if (filters.minPrice) {
        filtered = filtered.filter((p) => p.price >= parseInt(filters.minPrice));
      }
      if (filters.maxPrice) {
        filtered = filtered.filter((p) => p.price <= parseInt(filters.maxPrice));
      }
      if (filters.bedrooms) {
        const beds = parseInt(filters.bedrooms);
        filtered = filtered.filter((p) => p.bedrooms >= beds);
      }
      if (filters.bathrooms) {
        const baths = parseInt(filters.bathrooms);
        filtered = filtered.filter((p) => p.bathrooms >= baths);
      }
      if (filters.propertyType) {
        filtered = filtered.filter((p) =>
          p.title.toLowerCase().includes(filters.propertyType.toLowerCase())
        );
      }
      if (filters.verifiedOnly) {
        filtered = filtered.filter((p) => p.verified);
      }

      setProperties(filtered);
      setIsLoading(false);
    }, 300);
  }, [filters]);

  const handleSave = (propertyId: string) => {
    const currentSaved = localStorage.getItem('renter_saved_properties');
    let savedIds: string[] = currentSaved ? JSON.parse(currentSaved) : [];

    if (savedIds.includes(propertyId)) {
      savedIds = savedIds.filter((id) => id !== propertyId);
    } else {
      savedIds.push(propertyId);
    }

    localStorage.setItem('renter_saved_properties', JSON.stringify(savedIds));
    onSave(propertyId);
  };

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
          onSave={() => handleSave(property.id)}
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
