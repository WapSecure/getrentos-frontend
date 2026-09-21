'use client';

import { DateTimeField } from '@/components/shared/forms/DateTimeField';

/** A value from DateTimeField as the ISO instant the API wants; undefined until both date and time are picked. */
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
  <DateTimeField value={value} onChange={onChange} label={label} requireFuture />
);
