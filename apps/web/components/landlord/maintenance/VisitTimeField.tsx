'use client';

import { LegacyInput } from '@getrentos/ui';

/** `YYYY-MM-DDTHH:mm` in the browser's own clock, the shape a datetime-local input speaks. */
export const localDateTimeInput = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** A datetime-local value as the ISO instant the API wants; undefined while blank. */
export const visitToIso = (value: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

interface VisitTimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

/** Date and time for a vendor's visit — the earliest choice is right now. */
export const VisitTimeField = ({
  value,
  onChange,
  label = 'Visit date & time',
}: VisitTimeFieldProps) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
    <LegacyInput
      type="datetime-local"
      value={value}
      min={localDateTimeInput(new Date())}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    />
  </div>
);
