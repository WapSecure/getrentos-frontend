'use client';

import { LegacySelect } from '@getrentos/ui';

import { LayoutGrid, List } from 'lucide-react';

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
        <LegacySelect
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'recent' | 'property' | 'status')}
          className="px-4 py-1.5 text-sm cursor-pointer"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </LegacySelect>

        <div
          className="flex gap-1 rounded-xl bg-secondary p-1"
          role="group"
          aria-label="Application view"
        >
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ${
              viewMode === 'grid' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ${
              viewMode === 'list' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
