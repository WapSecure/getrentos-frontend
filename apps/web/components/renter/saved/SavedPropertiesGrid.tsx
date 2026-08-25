'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowUpDown } from 'lucide-react';
import { SavedPropertyCard } from './SavedPropertyCard';
import { Button } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';
import { type SavedListingItem, type Wishlist } from '@/services/renterService';

export type SavedFilterStatus = 'all' | 'applied' | 'viewed';

interface SavedPropertiesGridProps {
  properties: SavedListingItem[];
  total: number;
  isFiltered: boolean;
  viewMode: 'grid' | 'list';
  sortBy: 'recent' | 'price-low' | 'price-high' | 'trust-score';
  filterStatus: SavedFilterStatus;
  onRemove: (id: string) => void;
  onMoveToWishlist: (propertyId: string, wishlistId: string) => void;
  wishlists: Wishlist[];
  selectedProperties?: string[];
  onSelectProperty?: (id: string) => void;
}

export const SavedPropertiesGrid = ({
  properties,
  total,
  isFiltered,
  viewMode,
  sortBy,
  filterStatus,
  onRemove,
  onMoveToWishlist,
  wishlists,
  selectedProperties = [],
  onSelectProperty,
}: SavedPropertiesGridProps) => {
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
        <h3 className="text-lg font-medium text-foreground">
          {isFiltered ? 'No matching properties' : 'No saved properties yet'}
        </h3>
        <p className="text-muted-foreground mt-1">Start exploring and save properties you love</p>
        {!isFiltered && (
          <Button href={ROUTES.RENTER_DISCOVER} variant="primary" className="mt-4">
            Discover Properties
          </Button>
        )}
        {isFiltered && (
          <p className="text-muted-foreground mt-1">
            Try changing your filters to see more properties
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            Showing {properties.length} of {total} saved properties
          </span>
          {filterStatus !== 'all' && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Filtered by: {filterStatus === 'applied' ? 'Applied' : 'Recently Viewed'}
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
                : sortBy === 'trust-score'
                  ? 'Highest Landlord Trust'
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
          {properties.map((property, index) => (
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
