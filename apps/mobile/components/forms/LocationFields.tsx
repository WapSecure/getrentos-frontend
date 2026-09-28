import { useMemo } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@getrentos/ui-native';
import { SelectField } from './SelectField';
import { locationsApi } from '@/lib/api/locations';
import { getCitiesFor } from '@/lib/locationCities';

export function LocationFields({
  country,
  state,
  city,
  onCountryChange,
  onStateChange,
  onCityChange,
  errors,
}: {
  country: string;
  state: string;
  city: string;
  onCountryChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  errors?: { country?: string; state?: string; city?: string };
}) {
  const { spacing } = useTheme();
  const query = useQuery({
    queryKey: ['geo', 'locations'],
    queryFn: locationsApi.list,
    staleTime: 24 * 60 * 60 * 1000,
  });
  const countries = query.data ?? [];
  const selectedCountry = countries.find((item) => item.name === country);
  const cities = useMemo(() => getCitiesFor(country, state), [country, state]);
  return (
    <View style={{ gap: spacing.md }}>
      <SelectField
        label="Country"
        value={country}
        options={countries.map((item) => ({ value: item.name, label: item.name }))}
        onChange={(value) => {
          onCountryChange(value);
          onStateChange('');
          onCityChange('');
        }}
        placeholder={query.isPending ? 'Loading countries…' : 'Select country'}
        disabled={query.isPending}
        error={errors?.country}
      />
      <SelectField
        label="State"
        value={state}
        options={(selectedCountry?.states ?? []).map((item) => ({ value: item, label: item }))}
        onChange={(value) => {
          onStateChange(value);
          onCityChange('');
        }}
        placeholder={country ? 'Select state' : 'Select country first'}
        disabled={!selectedCountry}
        error={errors?.state}
      />
      <SelectField
        label="City"
        value={city}
        options={cities.map((item) => ({ value: item, label: item }))}
        onChange={onCityChange}
        placeholder={state ? 'Select city' : 'Select state first'}
        disabled={!state || cities.length === 0}
        error={errors?.city}
      />
    </View>
  );
}
