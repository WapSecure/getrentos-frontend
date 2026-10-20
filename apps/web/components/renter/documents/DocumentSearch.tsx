'use client';

import { Filter } from 'lucide-react';
import { useState } from 'react';
import { Button, IconButton, SearchInput, Select } from '@getrentos/ui';

interface DocumentSearchProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  filterType: FilterType;
  onFilterTypeChange: (type: FilterType) => void;
  filterStatus: FilterStatus;
  onFilterStatusChange: (status: FilterStatus) => void;
}

export type DocumentFilterType = 'all' | 'lease' | 'receipt' | 'inspection' | 'other';
export type DocumentFilterStatus = 'all' | 'active' | 'expiring' | 'expired';
type FilterType = DocumentFilterType;
type FilterStatus = DocumentFilterStatus;

export const DocumentSearch = ({
  searchTerm,
  onSearch,
  filterType,
  onFilterTypeChange,
  filterStatus,
  onFilterStatusChange,
}: DocumentSearchProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleClear = () => {
    onSearch('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <SearchInput
          value={searchTerm}
          onValueChange={onSearch}
          label="Search documents"
          placeholder="Search documents by name, category, or tags..."
          className="min-w-0 flex-1"
        />
        <IconButton
          label={showFilters ? 'Hide filters' : 'Show filters'}
          icon={<Filter />}
          variant={showFilters ? 'secondary' : 'outline'}
          aria-pressed={showFilters}
          aria-expanded={showFilters}
          onClick={() => setShowFilters(!showFilters)}
        />
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3">
          <Select
            value={filterType}
            onValueChange={(value) => onFilterTypeChange(value as FilterType)}
            ariaLabel="Document type"
            className="w-full sm:w-44"
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'lease', label: 'Lease' },
              { value: 'receipt', label: 'Receipt' },
              { value: 'inspection', label: 'Inspection' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <Select
            value={filterStatus}
            onValueChange={(value) => onFilterStatusChange(value as FilterStatus)}
            ariaLabel="Document status"
            className="w-full sm:w-44"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'expiring', label: 'Expiring' },
              { value: 'expired', label: 'Expired' },
            ]}
          />
          <Button size="sm" variant="ghost" onClick={handleClear}>
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
};
