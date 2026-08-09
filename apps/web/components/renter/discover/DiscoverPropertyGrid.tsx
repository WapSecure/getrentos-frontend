'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DiscoverPropertyCard } from './DiscoverPropertyCard';
import { Property } from '@/types/renter';
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

// Mock properties data
const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Modern Downtown Loft',
    location: 'Ikeja, Lagos',
    price: 200000,
    period: 'month',
    bedrooms: 2,
    bathrooms: 2,
    size: 1200,
    rating: 4.8,
    verified: true,
    image: '',
    score: 92,
    hasVirtualTour: true,
    virtualTourUrl: '#',
    landlordResponseRate: 95,
    landlordRating: 4.9,
    landlordReviews: 156,
    landlordVerified: true,
  },
  {
    id: '2',
    title: 'Cozy Studio Apartment',
    location: 'Victoria Island, Lagos',
    price: 150000,
    period: 'month',
    bedrooms: 1,
    bathrooms: 1,
    size: 650,
    rating: 4.6,
    verified: true,
    image: '',
    score: 78,
    hasVirtualTour: false,
    landlordResponseRate: 88,
    landlordRating: 4.7,
    landlordReviews: 89,
    landlordVerified: true,
  },
  {
    id: '3',
    title: 'Luxury Beachfront Villa',
    location: 'Elegushi Beach, Lagos',
    price: 800000,
    period: 'month',
    bedrooms: 4,
    bathrooms: 3,
    size: 3200,
    rating: 4.9,
    verified: true,
    image: '',
    score: 96,
    hasVirtualTour: true,
    virtualTourUrl: '#',
    landlordResponseRate: 98,
    landlordRating: 5.0,
    landlordReviews: 234,
    landlordVerified: true,
  },
  {
    id: '4',
    title: 'Executive 3-Bed Apartment',
    location: 'Ikoyi, Lagos',
    price: 350000,
    period: 'month',
    bedrooms: 3,
    bathrooms: 2,
    size: 1800,
    rating: 4.7,
    verified: true,
    image: '',
    score: 85,
    hasVirtualTour: true,
    virtualTourUrl: '#',
    landlordResponseRate: 92,
    landlordRating: 4.8,
    landlordReviews: 112,
    landlordVerified: true,
  },
  {
    id: '5',
    title: 'Affordable 2-Bed Flat',
    location: 'Surulere, Lagos',
    price: 120000,
    period: 'month',
    bedrooms: 2,
    bathrooms: 1,
    size: 950,
    rating: 4.5,
    verified: false,
    image: '',
    score: 65,
    hasVirtualTour: false,
    landlordResponseRate: 75,
    landlordRating: 4.2,
    landlordReviews: 45,
    landlordVerified: false,
  },
  {
    id: '6',
    title: 'Penthouse with Ocean View',
    location: 'Lekki Phase 1, Lagos',
    price: 550000,
    period: 'month',
    bedrooms: 3,
    bathrooms: 2,
    size: 2200,
    rating: 4.9,
    verified: true,
    image: '',
    score: 94,
    hasVirtualTour: true,
    virtualTourUrl: '#',
    landlordResponseRate: 96,
    landlordRating: 4.9,
    landlordReviews: 178,
    landlordVerified: true,
  },
];

const trackRecentlyViewed = (property: Property) => {
  const recent = localStorage.getItem('recently_viewed');
  let recentProperties: {
    id: string;
    title: string;
    location: string;
    price: number;
    image: string;
    viewedAt: string;
  }[] = recent ? JSON.parse(recent) : [];

  recentProperties = recentProperties.filter((p: { id: string }) => p.id !== property.id);

  recentProperties.unshift({
    id: property.id,
    title: property.title,
    location: property.location,
    price: property.price,
    image: property.image,
    viewedAt: new Date().toISOString(),
  });

  recentProperties = recentProperties.slice(0, 10);
  localStorage.setItem('recently_viewed', JSON.stringify(recentProperties));
};

export const DiscoverPropertyGrid = ({
  filters,
  savedProperties,
  onSave,
  onCompare,
}: DiscoverPropertyGridProps) => {
  const router = useRouter();
  const [properties, setProperties] = useState(mockProperties);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleScheduleViewing = (propertyId: string) => {
    router.push(`/renter/properties/${propertyId}/schedule`);
  };

  const handleApply = (propertyId: string) => {
    router.push(`/renter/properties/${propertyId}/apply`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <Home className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No properties found</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
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
          onScheduleViewing={() => handleScheduleViewing(property.id)}
          onApply={() => handleApply(property.id)}
        />
      ))}
    </div>
  );
};
