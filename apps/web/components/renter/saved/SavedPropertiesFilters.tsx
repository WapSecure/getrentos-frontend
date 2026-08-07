'use client';

import { LayoutGrid, List, ChevronDown } from 'lucide-react';

interface SavedPropertiesFiltersProps {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  sortBy: 'recent' | 'price-low' | 'price-high' | 'rating';
  setSortBy: (sort: 'recent' | 'price-low' | 'price-high' | 'rating') => void;
  filterStatus: 'all' | 'applied' | 'viewed' | 'price-drop';
  setFilterStatus: (status: 'all' | 'applied' | 'viewed' | 'price-drop') => void;
}

const statusOptions: { value: 'all' | 'applied' | 'viewed' | 'price-drop'; label: string }[] = [
  { value: 'all', label: 'All Properties' },
  { value: 'applied', label: 'Applied' },
  { value: 'viewed', label: 'Recently Viewed' },
  { value: 'price-drop', label: 'Price Drop' },
];

const sortOptions: { value: 'recent' | 'price-low' | 'price-high' | 'rating'; label: string }[] = [
  { value: 'recent', label: 'Recently Saved' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
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
                ? 'bg-[#c4a747] text-white'
                : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'recent' | 'price-low' | 'price-high' | 'rating')
            }
            className="appearance-none px-4 py-1.5 pr-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c4a747] cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-[#1a2a2f] text-[#c4a747] shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-[#1a2a2f] text-[#c4a747] shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
