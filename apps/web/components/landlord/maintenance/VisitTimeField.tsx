'use client';

import { DateTimeField } from '@/components/shared/forms/DateTimeField';

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

export const VisitTimeField = ({
  value,
  onChange,
  label = 'Visit date & time',
}: VisitTimeFieldProps) => (
  <DateTimeField value={value} onChange={onChange} label={label} requireFuture />
);
