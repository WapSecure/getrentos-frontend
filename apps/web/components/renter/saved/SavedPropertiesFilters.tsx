'use client';

import { LayoutGrid, List } from 'lucide-react';
import { SegmentedControl, Select, ToggleChip } from '@getrentos/ui';

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
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {statusOptions.map((option) => (
          <ToggleChip
            key={option.value}
            pressed={filterStatus === option.value}
            onPressedChange={() => setFilterStatus(option.value)}
          >
            {option.label}
          </ToggleChip>
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

        <SegmentedControl
          aria-label="Layout"
          value={viewMode}
          onValueChange={setViewMode}
          iconOnly
          size="sm"
          segments={[
            { value: 'grid', label: 'Grid view', icon: <LayoutGrid className="w-4 h-4" /> },
            { value: 'list', label: 'List view', icon: <List className="w-4 h-4" /> },
          ]}
        />
      </div>
    </div>
  );
};
