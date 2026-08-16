'use client';

import { useState } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Select } from '@getrentos/ui';

interface FilterState {
  type: string;
  property: string;
  sortBy: string;
}

interface MessageFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  unreadCount: number;
  totalCount: number;
}

export const MessageFilters = ({
  onFilterChange,
  unreadCount,
  totalCount,
}: MessageFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    property: 'all',
    sortBy: 'recent',
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Filters</span>
          <span className="text-xs text-gray-500">
            {unreadCount} unread / {totalCount} total
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-3 pt-0 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Message Type</label>
            <Select
              value={filters.type}
              onValueChange={(value) => handleFilterChange('type', value)}
              options={[
                { value: 'all', label: 'All Messages' },
                { value: 'unread', label: 'Unread' },
                { value: 'read', label: 'Read' },
                { value: 'sent', label: 'Sent by Me' },
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Sort By</label>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => handleFilterChange('sortBy', value)}
              options={[
                { value: 'recent', label: 'Most Recent' },
                { value: 'oldest', label: 'Oldest' },
                { value: 'unread', label: 'Unread First' },
                { value: 'property', label: 'By Property' },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
};
