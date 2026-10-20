'use client';

import { useState } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge, Button, Checkbox, CurrencyInput, Field, Input, Select } from '@getrentos/ui';

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

const bedroomSelectOptions = bedroomOptions.map((option) => ({
  value: option === 'Any' ? '' : option,
  label: option !== 'Any' && option !== '5+' ? `${option} bed` : option,
}));
const bathroomSelectOptions = bathroomOptions.map((option) => ({
  value: option === 'Any' ? '' : option,
  label: option !== 'Any' && option !== '4+' ? `${option} bath` : option,
}));
const propertyTypeOptions = [
  { value: '', label: 'Any' },
  ...propertyTypes.map((type) => ({ value: type, label: type })),
];

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
          {hasActiveFilters && <Badge>{activeFilterCount}</Badge>}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div id="property-discovery-filters" className="border-t border-border p-4">
          <div className="mb-4 space-y-3">
            {/* Location */}
            <Field label="Location">
              <Input
                type="text"
                value={filters.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="City, area, or postal code"
              />
            </Field>

            {/* Price Range: Min and Max side by side, full card width */}
            <div className="grid grid-cols-2 gap-2">
              <Field label="Min price">
                <CurrencyInput
                  prefix="₦"
                  value={filters.minPrice}
                  onValueChange={(v) => handleChange('minPrice', v === 0 ? '' : String(v))}
                  placeholder="Min"
                />
              </Field>
              <Field label="Max price">
                <CurrencyInput
                  prefix="₦"
                  value={filters.maxPrice}
                  onValueChange={(v) => handleChange('maxPrice', v === 0 ? '' : String(v))}
                  placeholder="Max"
                />
              </Field>
            </div>

            {/* Bedrooms + Bathrooms: compact pair */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bedrooms">
                <Select
                  value={filters.bedrooms}
                  onValueChange={(v) => handleChange('bedrooms', v)}
                  options={bedroomSelectOptions}
                  placeholder="Any"
                />
              </Field>
              <Field label="Bathrooms">
                <Select
                  value={filters.bathrooms}
                  onValueChange={(v) => handleChange('bathrooms', v)}
                  options={bathroomSelectOptions}
                  placeholder="Any"
                />
              </Field>
            </div>

            {/* Property Type */}
            <Field label="Property Type">
              <Select
                value={filters.propertyType}
                onValueChange={(v) => handleChange('propertyType', v)}
                options={propertyTypeOptions}
                placeholder="Any"
              />
            </Field>

            {/* Verified Only Toggle */}
            <Checkbox
              className="pt-1"
              checked={filters.verifiedOnly}
              onCheckedChange={(checked) => handleChange('verifiedOnly', checked)}
              label="Verified listings only"
            />
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
