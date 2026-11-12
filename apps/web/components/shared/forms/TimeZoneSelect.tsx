'use client';

import { useMemo } from 'react';
import { Select, type SelectOption } from '@sureground/ui/Select';

/** Used when the browser cannot list its zones. */
const FALLBACK_ZONES = [
  'Africa/Lagos',
  'Europe/London',
  'America/New_York',
  'America/Toronto',
  'America/Chicago',
  'Asia/Dubai',
];

const supportedZones = (): string[] => {
  try {
    const zones = Intl.supportedValuesOf('timeZone');
    if (zones.length) return zones;
  } catch {
    // Older browsers.
  }
  return FALLBACK_ZONES;
};

/** This device's IANA zone, or `fallback` when the browser does not say. */
export const browserTimeZone = (fallback = ''): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
  } catch {
    return fallback;
  }
};

/** Every zone the browser knows, searchable by city; keeps a saved zone it does not list. */
export const TimeZoneSelect = ({
  value,
  onValueChange,
  ariaLabel,
  placeholder = 'Choose a time zone',
}: {
  value: string;
  onValueChange: (zone: string) => void;
  ariaLabel?: string;
  placeholder?: string;
}) => {
  const options = useMemo<SelectOption[]>(() => {
    const zones = supportedZones();
    const all = value && !zones.includes(value) ? [value, ...zones] : zones;
    return all.map((zone) => ({ value: zone, label: zone.replace(/_/g, ' '), searchText: zone }));
  }, [value]);
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      options={options}
      ariaLabel={ariaLabel}
      placeholder={placeholder}
      searchPlaceholder="Search, e.g. London"
    />
  );
};
