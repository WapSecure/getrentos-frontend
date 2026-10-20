'use client';

import { LayoutGrid, List } from 'lucide-react';
import { Select } from '@getrentos/ui';

interface SavedPropertiesFiltersProps {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  sortBy: 'recent' | 'price-low' | 'price-high' | 'trust-score';
  setSortBy: (sort: 'recent' | 'price-low' | 'price-high' | 'trust-score') => void;
  filterStatus: 'all' | 'applied' | 'viewed';
  setFilterStatus: (status: 'all' | 'applied' | 'viewed') => void;
}

const statusOptions: { value: 'all' | 'applied' | 'viewed'; label: string }[] = [
  { value: 'all', label: 'All Properties' },
  { value: 'applied', label: 'Applied' },
  { value: 'viewed', label: 'Recently Viewed' },
];

const sortOptions: {
  value: 'recent' | 'price-low' | 'price-high' | 'trust-score';
  label: string;
}[] = [
  { value: 'recent', label: 'Recently Saved' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'trust-score', label: 'Highest Landlord Trust' },
];

export const SavedPropertiesFilters = ({
  viewMode,
  setViewMode,
  sortBy,
  setSortBy,
  filterStatus,
  setFilterStatus,
}: SavedPropertiesFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filterStatus === option.value}
            onClick={() => setFilterStatus(option.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 ${
              filterStatus === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Select
          ariaLabel="Sort saved properties"
          value={sortBy}
          onValueChange={(value) =>
            setSortBy(value as 'recent' | 'price-low' | 'price-high' | 'trust-score')
          }
          options={sortOptions}
          controlSize="sm"
          className="min-w-0 sm:w-52"
        />

        {/* View Toggle */}
        <div className="flex gap-1 p-1 bg-secondary rounded-lg" role="group" aria-label="Layout">
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 ${
              viewMode === 'grid' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 ${
              viewMode === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <List className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
