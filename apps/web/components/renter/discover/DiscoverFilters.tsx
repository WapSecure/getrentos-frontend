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

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-foreground">Filters</span>
          {hasActiveFilters && <span className="w-2 h-2 bg-primary rounded-full" />}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Price Range (₦)
              </label>
              <div className="flex gap-2">
                <div className="w-1/2">
                  <CurrencyInput
                    prefix="₦"
                    value={filters.minPrice}
                    onValueChange={(v) => handleChange('minPrice', v === 0 ? '' : String(v))}
                    placeholder="Min"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="w-1/2">
                  <CurrencyInput
                    prefix="₦"
                    value={filters.maxPrice}
                    onValueChange={(v) => handleChange('maxPrice', v === 0 ? '' : String(v))}
                    placeholder="Max"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Bedrooms */}
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

            {/* Bathrooms */}
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
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <LegacyInput
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => handleChange('verifiedOnly', e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Verified listings only</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleApply} variant="primary" size="sm">
              Apply Filters
            </Button>
            <Button onClick={handleReset} variant="ghost" size="sm">
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
