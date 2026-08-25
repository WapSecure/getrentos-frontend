'use client';

import { LegacyInput } from '@getrentos/ui';

import { LegacySelect } from '@getrentos/ui';

import { Search, X, Filter } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@getrentos/ui';

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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <LegacyInput
            type="text"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search documents by name, category, or tags..."
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2.5 rounded-xl border transition-colors ${
            showFilters
              ? 'border-primary bg-accent text-primary'
              : 'border-border hover:bg-secondary'
          }`}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 bg-card rounded-xl border border-border">
          <LegacySelect
            value={filterType}
            onChange={(e) => onFilterTypeChange(e.target.value as FilterType)}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="lease">Lease</option>
            <option value="receipt">Receipt</option>
            <option value="inspection">Inspection</option>
            <option value="other">Other</option>
          </LegacySelect>
          <LegacySelect
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value as FilterStatus)}
            className="px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
          </LegacySelect>
          <Button size="sm" variant="ghost" onClick={handleClear}>
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
};
