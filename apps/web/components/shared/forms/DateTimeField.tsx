'use client';

import { useId } from 'react';
import { DatePicker, TimePicker } from '@sureground/ui';

// Keeps the `datetime-local` value shape (`YYYY-MM-DDTHH:mm`). Until both halves are picked the value is partial yet truthy: check `isCompleteDateTime` first.

const COMPLETE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export const isCompleteDateTime = (value: string) => COMPLETE.test(value);

export const isFutureDateTime = (value: string) =>
  isCompleteDateTime(value) && new Date(value).getTime() > Date.now();

/** Today as `YYYY-MM-DD` in the visitor's own timezone, the earliest date worth offering. */
export const todayISODate = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const split = (value: string) => {
  const [date = '', time = ''] = value.split('T');
  return { date, time };
};

const join = (date: string, time: string) => (date || time ? `${date}T${time}` : '');

interface DateTimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  /** Earliest selectable date, `YYYY-MM-DD`. Defaults to today; pass `null` to allow past dates. */
  minDate?: string | null;
  requireFuture?: boolean;
  timeStep?: number;
  minHour?: number;
  /** Latest hour of day to offer, exclusive (0–24). Defaults to the whole day. */
  maxHour?: number;
  className?: string;
}

export const DateTimeField = ({
  value,
  onChange,
  label,
  minDate,
  requireFuture = false,
  timeStep = 30,
  minHour,
  maxHour,
  className,
}: DateTimeFieldProps) => {
  const labelId = useId();
  const { date, time } = split(value);
  const inPast = requireFuture && isCompleteDateTime(value) && !isFutureDateTime(value);

  return (
    <div role="group" aria-labelledby={labelId} className={className}>
      <span id={labelId} className="mb-1 block text-sm font-medium text-foreground">
        {label}
      </span>
      <div className="grid grid-cols-2 gap-3">
        <DatePicker
          value={date}
          onChange={(next) => onChange(join(next, time))}
          min={minDate === null ? undefined : (minDate ?? todayISODate())}
          ariaLabel="Date"
        />
        <TimePicker
          value={time}
          onChange={(next) => onChange(join(date, next))}
          step={timeStep}
          minHour={minHour}
          maxHour={maxHour}
          ariaLabel="Time"
        />
      </div>
      {inPast && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          That time has already passed. Pick a time in the future.
        </p>
      )}
    </div>
  );
};
