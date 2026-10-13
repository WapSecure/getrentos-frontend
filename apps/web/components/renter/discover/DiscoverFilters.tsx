'use client';

import { LegacyInput } from '@getrentos/ui';

import { LegacySelect } from '@getrentos/ui';

import { useState } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, CurrencyInput } from '@getrentos/ui';

interface Filters {
  location: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  verifiedOnly: boolean;
  /** Estate public slug carried through from the URL, not editable in the panel. */
  estate?: string;
}

interface DiscoverFiltersProps {
  onApplyFilters: (filters: Filters) => void;
}

const propertyTypes = ['Apartment', 'House', 'Studio', 'Duplex', 'Townhouse', 'Condo'];
const bedroomOptions = ['Any', '1', '2', '3', '4', '5+'];
const bathroomOptions = ['Any', '1', '2', '3', '4+'];

export const DiscoverFilters = ({ onApplyFilters }: DiscoverFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    location: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    propertyType: '',
    verifiedOnly: false,
  });

  const handleChange = (key: keyof Filters, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      location: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: '',
      propertyType: '',
      verifiedOnly: false,
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '' && v !== false);
  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== '' && value !== false
  ).length;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="property-discovery-filters"
        className="flex min-h-12 w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-secondary/60"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Filters</span>
          {hasActiveFilters && (
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-foreground">
              {activeFilterCount}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div id="property-discovery-filters" className="border-t border-border p-4">
          <div className="mb-4 space-y-3">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Location</label>
              <LegacyInput
                type="text"
                value={filters.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="City, area, or postal code"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Price Range: Min and Max side by side, full card width */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Price Range (₦)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <CurrencyInput
                  prefix="₦"
                  value={filters.minPrice}
                  onValueChange={(v) => handleChange('minPrice', v === 0 ? '' : String(v))}
                  placeholder="Min"
                />
                <CurrencyInput
                  prefix="₦"
                  value={filters.maxPrice}
                  onValueChange={(v) => handleChange('maxPrice', v === 0 ? '' : String(v))}
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Bedrooms + Bathrooms: compact pair */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Bedrooms</label>
                <LegacySelect
                  value={filters.bedrooms}
                  onChange={(e) => handleChange('bedrooms', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {bedroomOptions.map((option) => (
                    <option key={option} value={option === 'Any' ? '' : option}>
                      {option} {option !== 'Any' && option !== '5+' ? 'bed' : ''}
                    </option>
                  ))}
                </LegacySelect>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Bathrooms</label>
                <LegacySelect
                  value={filters.bathrooms}
                  onChange={(e) => handleChange('bathrooms', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {bathroomOptions.map((option) => (
                    <option key={option} value={option === 'Any' ? '' : option}>
                      {option} {option !== 'Any' && option !== '4+' ? 'bath' : ''}
                    </option>
                  ))}
                </LegacySelect>
              </div>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Property Type
              </label>
              <LegacySelect
                value={filters.propertyType}
                onChange={(e) => handleChange('propertyType', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Any</option>
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </LegacySelect>
            </div>

            {/* Verified Only Toggle */}
            <label className="flex cursor-pointer items-center gap-2 pt-1">
              <LegacyInput
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(e) => handleChange('verifiedOnly', e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">Verified listings only</span>
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <Button onClick={handleApply} variant="primary" size="sm">
              Show results
            </Button>
            <Button onClick={handleReset} variant="ghost" size="sm" disabled={!hasActiveFilters}>
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
