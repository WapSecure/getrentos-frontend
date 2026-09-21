'use client';

import { useId } from 'react';
import { DatePicker, TimePicker } from '@getrentos/ui';

/**
 * A date and a time, chosen with the app's own pickers instead of the browser's
 * `datetime-local` control (which looks different on every device and can't be
 * styled). The value keeps the exact shape that control had, `YYYY-MM-DDTHH:mm`,
 * so a form can swap one for the other without touching its own logic.
 *
 * Until both halves are picked the value is partial (`2026-09-22T` or `T14:00`),
 * which is truthy but not a real moment: check it with `isCompleteDateTime`
 * before building a Date from it.
 */

const COMPLETE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export const isCompleteDateTime = (value: string) => COMPLETE.test(value);

/** A whole date and time that is still to come. */
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
  /** Warn (and let the form block) when the chosen moment has already passed. */
  requireFuture?: boolean;
  /** Minutes between the times offered. */
  timeStep?: number;
  className?: string;
}

export const DateTimeField = ({
  value,
  onChange,
  label,
  minDate,
  requireFuture = false,
  timeStep = 30,
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
        />
        <TimePicker value={time} onChange={(next) => onChange(join(date, next))} step={timeStep} />
      </div>
      {inPast && (
        <p role="alert" className="mt-1 text-xs text-red-500">
          That time has already passed. Pick a time in the future.
        </p>
      )}
    </div>
  );
};
