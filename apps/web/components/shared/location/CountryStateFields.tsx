'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Field, Select } from '@getrentos/ui';
import { listLocations } from '@/services/locationsService';
import { unwrap } from '@/lib/apiHelpers';

interface CountryStateFieldsProps {
  country: string;
  state: string;
  onCountryChange: (country: string) => void;
  onStateChange: (state: string) => void;
  countryLabel?: string;
  stateLabel?: string;
  countryPlaceholder?: string;
  statePlaceholder?: string;
}

/**
 * Country + State dropdowns driven by the /geo/locations reference data.
 * Selecting a country populates its states. Values are the display names
 * (e.g. "Nigeria", "Lagos") to match how addresses are stored.
 */
export const CountryStateFields = ({
  country,
  state,
  onCountryChange,
  onStateChange,
  countryLabel = 'Country',
  stateLabel = 'State',
  countryPlaceholder = 'Select country',
  statePlaceholder = 'Select state',
}: CountryStateFieldsProps) => {
  const { data: locations = [] } = useQuery({
    queryKey: ['geo', 'locations'],
    queryFn: () => unwrap(listLocations()),
  });

  const countryOptions = useMemo(
    () => locations.map((c) => ({ value: c.name, label: c.name })),
    [locations]
  );

  const stateOptions = useMemo(() => {
    const selected = locations.find((c) => c.name === country);
    return (selected?.states ?? []).map((s) => ({ value: s, label: s }));
  }, [locations, country]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label={countryLabel}>
        <Select
          value={country}
          onValueChange={(value) => {
            onCountryChange(value);
            onStateChange('');
          }}
          options={countryOptions}
          placeholder={countryPlaceholder}
        />
      </Field>
      <Field label={stateLabel}>
        <Select
          value={state}
          onValueChange={onStateChange}
          options={stateOptions}
          placeholder={stateOptions.length === 0 ? 'Select a country first' : statePlaceholder}
          disabled={stateOptions.length === 0}
        />
      </Field>
    </div>
  );
};
