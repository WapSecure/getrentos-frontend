'use client';

import { LegacySelect } from '@getrentos/ui';

import { LayoutGrid, List } from 'lucide-react';

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
            onClick={() => setFilterStatus(option.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === option.value
                ? 'bg-primary text-white'
                : 'bg-secondary text-muted-foreground hover:bg-gray-200 dark:hover:bg-white/20'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <LegacySelect
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as 'recent' | 'price-low' | 'price-high' | 'trust-score')
          }
          className="px-4 py-1.5 text-sm cursor-pointer"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </LegacySelect>

        {/* View Toggle */}
        <div className="flex gap-1 p-1 bg-secondary rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-card text-primary shadow-sm' : 'text-gray-500'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-card text-primary shadow-sm' : 'text-gray-500'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
