'use client';

import { LayoutGrid, List } from 'lucide-react';
import { SegmentedControl, Select } from '@getrentos/ui';

interface ApplicationsFilterSortProps {
  filterStatus: 'all' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  setFilterStatus: (
    status: 'all' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn'
  ) => void;
  sortBy: 'recent' | 'property' | 'status';
  setSortBy: (sort: 'recent' | 'property' | 'status') => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

const statusOptions: {
  value: 'all' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  label: string;
}[] = [
  { value: 'all', label: 'All Applications' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const sortOptions: { value: 'recent' | 'property' | 'status'; label: string }[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'property', label: 'By Property' },
  { value: 'status', label: 'By Status' },
];

export const ApplicationsFilterSort = ({
  filterStatus,
  setFilterStatus,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
}: ApplicationsFilterSortProps) => {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div
        className="flex min-w-0 gap-1 overflow-x-auto sm:flex-1"
        role="tablist"
        aria-label="Application status"
      >
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={filterStatus === option.value}
            onClick={() => setFilterStatus(option.value)}
            className={`min-h-10 shrink-0 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ${
              filterStatus === option.value
                ? 'bg-primary/10 text-primary ring-1 ring-primary/10'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as 'recent' | 'property' | 'status')}
          options={sortOptions}
          ariaLabel="Sort applications"
          className="min-w-0 flex-1 sm:w-44 sm:flex-none"
        />

        <SegmentedControl
          aria-label="Application view"
          iconOnly
          value={viewMode}
          onValueChange={setViewMode}
          segments={[
            { value: 'grid', label: 'Grid view', icon: <LayoutGrid /> },
            { value: 'list', label: 'List view', icon: <List /> },
          ]}
          className="shrink-0"
        />
      </div>
    </div>
  );
};
