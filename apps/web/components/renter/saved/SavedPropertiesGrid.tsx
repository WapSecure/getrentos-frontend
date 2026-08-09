'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Filter, ArrowUpDown } from 'lucide-react';
import { SavedPropertyCard } from './SavedPropertyCard';
import { Property } from '@/types/renter';
import { Button } from '@/components/ui/Button';

interface SavedPropertiesGridProps {
  properties: Property[];
  viewMode: 'grid' | 'list';
  sortBy: 'recent' | 'price-low' | 'price-high' | 'rating';
  filterStatus: 'all' | 'applied' | 'viewed' | 'price-drop';
  onRemove: (id: string) => void;
  onMoveToWishlist: (propertyId: string, wishlistId: string) => void;
  wishlists: { id: string; name: string; propertyIds: string[] }[];
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
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // Sort and filter properties
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsFiltering(true);

    let filtered = [...properties];

    switch (filterStatus) {
      case 'applied':
        // In production, filter by properties user has applied to
        filtered = filtered.filter((p) => ['1'].includes(p.id));
        break;
      case 'viewed':
        // In production, filter by recently viewed properties
        filtered = filtered;
        break;
      case 'price-drop':
        // In production, filter by properties with price drops
        filtered = filtered.filter((p) => p.id === '5');
        break;
      default:
        break;
    }

    // Apply sorting
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
        // In production, sort by saved date
        break;
    }

    setFilteredProperties(filtered);

    // Simulate filter delay for smooth animation
    setTimeout(() => setIsFiltering(false), 300);
  }, [properties, sortBy, filterStatus]);

  // Get filter status count
  const getStatusCount = (status: string) => {
    switch (status) {
      case 'applied':
        return properties.filter((p) => ['1'].includes(p.id)).length;
      case 'price-drop':
        return properties.filter((p) => p.id === '5').length;
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
        <Button href="/renter/discover" variant="primary" className="mt-4">
          Discover Properties
        </Button>
      </motion.div>
    );
  }

  if (isFiltering) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
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
      {/* Filter Stats Bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            Showing {filteredProperties.length} of {properties.length} properties
          </span>
          {filterStatus !== 'all' && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Filtered by:{' '}
              {filterStatus === 'applied'
                ? 'Applied'
                : filterStatus === 'price-drop'
                  ? 'Price Drop'
                  : 'Viewed'}
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

      {/* Properties Grid/List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
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

      {/* Load More Section (if pagination needed) */}
      {filteredProperties.length >= 10 && (
        <div className="text-center pt-4">
          <Button variant="outline" className="gap-2">
            Load More Properties
          </Button>
        </div>
      )}
    </div>
  );
};
