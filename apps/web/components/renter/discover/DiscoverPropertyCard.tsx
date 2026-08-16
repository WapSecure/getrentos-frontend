'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Heart,
  Star,
  GitCompare,
  Calendar,
  Home,
  Shield,
} from 'lucide-react';
import { Button } from '@getrentos/ui';
import { Property } from '@/types/renter';
import { VirtualTourBadge } from './features/VirtualTourBadge';
import { PropertyScore } from './features/PropertyScore';
import { LandlordMetrics } from './features/LandlordMetrics';
import { CommuteCalculator } from './features/CommuteCalculator';
import { RentVsBuyCalculator } from './features/RentVsBuyCalculator';
import { NeighborhoodCompare } from './features/NeighborhoodCompare';

interface DiscoverPropertyCardProps {
  property: Property;
  isSaved: boolean;
  onSave: () => void;
  onCompare: () => void;
  onViewDetails: () => void;
  onScheduleViewing: () => void;
  onApply: () => void;
  onOpenTour: () => void;
}

export const DiscoverPropertyCard = ({
  property,
  isSaved,
  onSave,
  onCompare,
  onViewDetails,
  onScheduleViewing,
  onApply,
  onOpenTour,
}: DiscoverPropertyCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatPrice = () => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(property.price)}${property.period === 'month' ? '/mo' : property.period === 'year' ? '/yr' : '/wk'}`;
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave();
  };

  const handleScheduleViewingClick = () => {
    onScheduleViewing();
  };

  const handleCompareClick = () => {
    onCompare();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-card rounded-xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300"
    >
      <div className="relative h-48 bg-linear-to-br from-secondary to-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <Home className="w-12 h-12 text-gray-400 dark:text-gray-600" />
        </div>

        <VirtualTourBadge hasTour={property.hasVirtualTour || false} onOpenTour={onOpenTour} />

        {property.verified && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full z-10">
            <Shield className="w-3 h-3" />
            <span>Verified</span>
          </div>
        )}

        <button
          onClick={handleSaveClick}
          className="absolute top-3 right-3 p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white transition-colors z-10"
        >
          {isSaved ? (
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          ) : (
            <Heart className="w-4 h-4 text-gray-600" />
          )}
        </button>

        <div className="absolute bottom-3 left-3 bg-primary text-primary-foreground px-2 py-1 rounded-lg text-sm font-bold z-10">
          {formatPrice()}
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-white/90 dark:bg-gray-800/90 rounded-lg z-10">
          <Star className="w-3 h-3 fill-primary text-primary" />
          <span className="text-xs font-medium text-foreground">{property.rating}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {property.title}
        </h3>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
          <MapPin className="w-3 h-3" />
          <span className="text-xs line-clamp-1">{property.location}</span>
        </div>

        <div className="mt-2">
          <PropertyScore score={property.score || 85} size="sm" />
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bed className="w-3 h-3" />
            <span>
              {property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-3 h-3" />
            <span>
              {property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Square className="w-3 h-3" />
            <span>{property.size} sqft</span>
          </div>
        </div>

        <LandlordMetrics
          responseRate={property.landlordResponseRate || 92}
          responseTime="2-4 hours"
          rating={property.landlordRating || 4.8}
          totalReviews={property.landlordReviews || 127}
          verifiedBadge={property.landlordVerified || false}
        />

        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="sm" variant="primary" onClick={onViewDetails} className="flex-1">
            View Details
          </Button>
          <Button size="sm" variant="outline" onClick={handleScheduleViewingClick} className="px-2">
            <Calendar className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleCompareClick} className="px-2">
            <GitCompare className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-3 mt-2 text-xs border-t border-gray-100 dark:border-gray-800 pt-2">
          <CommuteCalculator propertyLocation={property.location} />
          <RentVsBuyCalculator propertyPrice={property.price} monthlyRent={property.price / 12} />
          <NeighborhoodCompare />
        </div>

        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3"
          >
            <Button size="sm" variant="secondary" onClick={onApply} fullWidth>
              Apply Now
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
