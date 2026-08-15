'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Filter, ArrowUpDown } from 'lucide-react';
import { SavedPropertyCard } from './SavedPropertyCard';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants/auth';
import { renterService, type SavedListingItem, type Wishlist } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

export type SavedFilterStatus = 'all' | 'applied' | 'viewed';

interface SavedPropertiesGridProps {
  properties: SavedListingItem[];
  viewMode: 'grid' | 'list';
  sortBy: 'recent' | 'price-low' | 'price-high' | 'rating';
  filterStatus: SavedFilterStatus;
  onRemove: (id: string) => void;
  onMoveToWishlist: (propertyId: string, wishlistId: string) => void;
  wishlists: Wishlist[];
  selectedProperties?: string[];
  onSelectProperty?: (id: string) => void;
}

export const SavedPropertiesGrid = ({
  properties,
  viewMode,
  sortBy,
  filterStatus,
  onRemove,
  onMoveToWishlist,
  wishlists,
  selectedProperties = [],
  onSelectProperty,
}: SavedPropertiesGridProps) => {
  const { data: applications = [] } = useQuery({
    queryKey: renterKeys.applications,
    queryFn: () => unwrap(renterService.listMyApplications()),
  });
  const { data: recentlyViewed = [] } = useQuery({
    queryKey: renterKeys.recentlyViewed,
    queryFn: () => unwrap(renterService.listRecentlyViewed()),
  });

  const appliedIds = useMemo(() => new Set(applications.map((a) => a.id)), [applications]);
  const viewedIds = useMemo(() => new Set(recentlyViewed.map((r) => r.id)), [recentlyViewed]);

  const filteredProperties = useMemo(() => {
    let filtered = [...properties];

    switch (filterStatus) {
      case 'applied':
        filtered = filtered.filter((p) => appliedIds.has(p.id));
        break;
      case 'viewed':
        filtered = filtered.filter((p) => viewedIds.has(p.id));
        break;
      default:
        break;
    }

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
        break;
    }

    return filtered;
  }, [properties, sortBy, filterStatus, appliedIds, viewedIds]);

  const getStatusCount = (status: SavedFilterStatus) => {
    switch (status) {
      case 'applied':
        return properties.filter((p) => appliedIds.has(p.id)).length;
      case 'viewed':
        return properties.filter((p) => viewedIds.has(p.id)).length;
      default:
        return properties.length;
    }
  };

  if (properties.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 bg-card rounded-xl border border-border"
      >
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <Heart className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-foreground">No saved properties yet</h3>
        <p className="text-muted-foreground mt-1">Start exploring and save properties you love</p>
        <Button href={ROUTES.RENTER_DISCOVER} variant="primary" className="mt-4">
          Discover Properties
        </Button>
      </motion.div>
    );
  }

  if (filteredProperties.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 bg-card rounded-xl border border-border"
      >
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <Filter className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-foreground">No matching properties</h3>
        <p className="text-muted-foreground mt-1">
          Try changing your filters to see more properties
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            Showing {filteredProperties.length} of {properties.length} properties
          </span>
          {filterStatus !== 'all' && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Filtered by: {filterStatus === 'applied' ? 'Applied' : 'Recently Viewed'} (
              {getStatusCount(filterStatus)})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3 h-3" />
          <span>
            Sorted by:{' '}
            {sortBy === 'price-low'
              ? 'Price (Low to High)'
              : sortBy === 'price-high'
                ? 'Price (High to Low)'
                : sortBy === 'rating'
                  ? 'Highest Rated'
                  : 'Recently Saved'}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewMode}-${sortBy}-${filterStatus}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}
        >
          {filteredProperties.map((property, index) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <SavedPropertyCard
                property={property}
                viewMode={viewMode}
                onRemove={onRemove}
                onMoveToWishlist={onMoveToWishlist}
                wishlists={wishlists}
                isSelected={selectedProperties.includes(property.id)}
                onSelect={onSelectProperty ? () => onSelectProperty(property.id) : undefined}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
