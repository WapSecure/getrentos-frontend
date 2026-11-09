'use client';

import { LayoutGrid, List } from '@sureground/icons';
import { SegmentedControl, Select, ToggleChip } from '@sureground/ui';

interface SavedPropertiesFiltersProps {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  sortBy: 'recent' | 'price-low' | 'price-high' | 'trust-score';
  setSortBy: (sort: 'recent' | 'price-low' | 'price-high' | 'trust-score') => void;
  filterStatus: 'all' | 'applied' | 'viewed';
  setFilterStatus: (status: 'all' | 'applied' | 'viewed') => void;
}

const statusOptions: { value: 'all' | 'applied' | 'viewed'; label: string }[] = [
  { value: 'all', label: 'All properties' },
  { value: 'applied', label: 'Applied' },
  { value: 'viewed', label: 'Recently viewed' },
];

const sortOptions: {
  value: 'recent' | 'price-low' | 'price-high' | 'trust-score';
  label: string;
}[] = [
  { value: 'recent', label: 'Recently saved' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
  { value: 'trust-score', label: 'Highest landlord trust' },
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
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
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
