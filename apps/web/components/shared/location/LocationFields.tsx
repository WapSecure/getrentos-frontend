'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Field, Select } from '@getrentos/ui';
import { listLocations } from '@/services/locationsService';
import { unwrap } from '@/lib/apiHelpers';
import { getCitiesFor } from '@/lib/constants/locations';

interface LocationFieldsProps {
  country: string;
  state: string;
  city?: string;
  onCountryChange: (country: string) => void;
  onStateChange: (state: string) => void;
  onCityChange?: (city: string) => void;
  /** Show the City dropdown (defaults to true). */
  showCity?: boolean;
  countryLabel?: string;
  stateLabel?: string;
  cityLabel?: string;
  countryPlaceholder?: string;
  statePlaceholder?: string;
  cityPlaceholder?: string;
  /** Marks the Country, State (and City) labels as required. */
  required?: boolean;
  className?: string;
}

/**
 * Country + State + City dropdowns. Country and State are driven by the
 * backend `/geo/locations` reference data; City comes from the location
 * constants so users never type a city name by hand.
 */
export const LocationFields = ({
  country,
  state,
  city = '',
  onCountryChange,
  onStateChange,
  onCityChange,
  showCity = true,
  countryLabel = 'Country',
  stateLabel = 'State',
  cityLabel = 'City',
  countryPlaceholder = 'Select country',
  statePlaceholder = 'Select state',
  cityPlaceholder = 'Select city',
  required = false,
  className,
}: LocationFieldsProps) => {
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

  const cityOptions = useMemo(
    () => getCitiesFor(state, country).map((c) => ({ value: c, label: c })),
    [state, country]
  );

  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={countryLabel} required={required}>
          <Select
            value={country}
            onValueChange={(value) => {
              onCountryChange(value);
              onStateChange('');
              onCityChange?.('');
            }}
            options={countryOptions}
            placeholder={countryPlaceholder}
          />
        </Field>
        <Field label={stateLabel} required={required}>
          <Select
            value={state}
            onValueChange={(value) => {
              onStateChange(value);
              onCityChange?.('');
            }}
            options={stateOptions}
            placeholder={stateOptions.length === 0 ? 'Select a country first' : statePlaceholder}
            disabled={stateOptions.length === 0}
          />
        </Field>
      </div>
      {showCity && (
        <div className="mt-4">
          <Field label={cityLabel} required={required}>
            <Select
              value={city}
              onValueChange={onCityChange ?? (() => undefined)}
              options={cityOptions}
              placeholder={
                cityOptions.length === 0
                  ? state
                    ? 'No cities available for this state'
                    : 'Select a state first'
                  : cityPlaceholder
              }
              disabled={cityOptions.length === 0}
            />
          </Field>
        </div>
      )}
    </div>
  );
};
