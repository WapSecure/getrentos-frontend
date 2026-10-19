'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  subMonths,
  addDays,
} from 'date-fns';
import { cn } from '@getrentos/shared';
import { controlShell, type ControlSize } from './controlStyles';
import { useFieldControl } from './fieldContext';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  /**
   * Individual days to grey out, as `YYYY-MM-DD` (the same shape the API uses
   * for the shortlet booking calendar). Lets a picker show what is actually
   * takeable instead of accepting a date that only fails on submit.
   */
  disabledDates?: readonly string[];
  className?: string;
  /** Trigger id; inside a Field the field supplies it. */
  id?: string;
  invalid?: boolean;
  required?: boolean;
  /** Offer a "Clear" action once a date is chosen; clearing calls onChange(''). */
  clearable?: boolean;
  ariaLabel?: string;
  controlSize?: ControlSize;
}

const toDate = (value?: string) => (value ? parseISO(value) : undefined);

export const DatePicker = ({
  value,
  onChange,
  placeholder = 'Select date',
  min,
  max,
  disabled,
  disabledDates,
  className,
  id,
  invalid,
  required,
  clearable = false,
  ariaLabel,
  controlSize,
}: DatePickerProps) => {
  const field = useFieldControl({ id, invalid, required });
  const [open, setOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusDay, setFocusDay] = useState<Date | null>(null);
  const selected = toDate(value);
  const minDate = toDate(min);
  const maxDate = toDate(max);
  const [viewMonth, setViewMonth] = useState(() => selected ?? new Date());

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const leadingBlanks = getDay(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const unavailable = useMemo(() => new Set(disabledDates ?? []), [disabledDates]);

  const isDisabled = (day: Date) =>
    (minDate && isBefore(day, minDate) && !isSameDay(day, minDate)) ||
    (maxDate && isAfter(day, maxDate) && !isSameDay(day, maxDate)) ||
    unavailable.has(format(day, 'yyyy-MM-dd'));

  const handleSelect = (day: Date) => {
    if (isDisabled(day)) return;
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  };

  // Keyboard: arrows move a day/week (crossing months), Home/End go to the week's ends.
  useEffect(() => {
    if (!open || !focusDay) return;
    const key = format(focusDay, 'yyyy-MM-dd');
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${key}"]`)?.focus();
  }, [open, focusDay, viewMonth]);

  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const from = focusDay ?? selected ?? new Date();
    const step: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    let next: Date | null = null;
    if (event.key in step) next = addDays(from, step[event.key]);
    else if (event.key === 'Home') next = addDays(from, -getDay(from));
    else if (event.key === 'End') next = addDays(from, 6 - getDay(from));
    if (!next) return;
    event.preventDefault();
    if (!isSameMonth(next, viewMonth)) setViewMonth(startOfMonth(next));
    setFocusDay(next);
  };
  const today = new Date();

  return (
    <RadixPopover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setViewMonth(selected ?? new Date());
          setFocusDay(selected ?? new Date());
        }
      }}
    >
      <RadixPopover.Trigger asChild>
        <button
          type="button"
          id={field.id}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={
            ariaLabel
              ? `${ariaLabel}: ${selected ? format(selected, 'MMMM d, yyyy') : placeholder}`
              : undefined
          }
          {...field.ariaProps}
          className={cn(
            'flex items-center justify-between gap-2 text-left',
            controlShell({ size: controlSize, invalid: field.invalid, disabled }),
            className
          )}
        >
          <span className={cn('truncate', selected ? 'text-foreground' : 'text-muted-foreground')}>
            {selected ? format(selected, 'MMM d, yyyy') : placeholder}
          </span>
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </RadixPopover.Trigger>

      <AnimatePresence>
        {open && (
          <RadixPopover.Portal forceMount>
            <RadixPopover.Content
              asChild
              sideOffset={8}
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                role="dialog"
                aria-label={ariaLabel ?? 'Choose a date'}
                className="z-[70] w-[18.5rem] rounded-2xl border border-border bg-card p-3 shadow-lg focus:outline-none"
              >
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setViewMonth((m) => subMonths(m, 1))}
                    className="rounded-lg p-1.5 transition-colors hover:bg-secondary focus:outline-none focus:ring-4 focus:ring-primary/12"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span
                    aria-live="polite"
                    className="text-sm font-semibold tracking-[-0.02em] text-foreground"
                  >
                    {format(viewMonth, 'MMMM yyyy')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewMonth((m) => addMonths(m, 1))}
                    className="rounded-lg p-1.5 transition-colors hover:bg-secondary focus:outline-none focus:ring-4 focus:ring-primary/12"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-1 grid grid-cols-7 gap-1">
                  {WEEKDAY_LABELS.map((label) => (
                    <div
                      key={label}
                      className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                <div ref={gridRef} onKeyDown={onGridKeyDown} className="grid grid-cols-7 gap-1">
                  {Array.from({ length: leadingBlanks }).map((_, i) => (
                    <div key={`blank-${i}`} />
                  ))}
                  {days.map((day) => {
                    const isSelected = selected && isSameDay(day, selected);
                    const dayDisabled = isDisabled(day);
                    const focusable = focusDay
                      ? isSameDay(day, focusDay)
                      : isSelected || isToday(day);
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        data-day={format(day, 'yyyy-MM-dd')}
                        tabIndex={focusable ? 0 : -1}
                        aria-label={format(day, 'EEEE, MMMM d, yyyy')}
                        aria-pressed={Boolean(isSelected)}
                        aria-current={isToday(day) ? 'date' : undefined}
                        onClick={() => handleSelect(day)}
                        onFocus={() => setFocusDay(day)}
                        disabled={dayDisabled}
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg text-sm tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                          isSameMonth(day, viewMonth) ? 'text-foreground' : 'text-muted-foreground',
                          isSelected
                            ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                            : 'hover:bg-secondary',
                          isToday(day) && !isSelected && 'ring-1 ring-inset ring-primary',
                          dayDisabled && 'opacity-30 pointer-events-none'
                        )}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-border pt-2">
                  <button
                    type="button"
                    onClick={() => handleSelect(today)}
                    disabled={Boolean(isDisabled(today))}
                    className="flex-1 rounded-lg py-1.5 text-center text-xs font-medium text-primary transition-colors hover:bg-accent focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/12 disabled:pointer-events-none disabled:opacity-40"
                  >
                    Today
                  </button>
                  {clearable && value && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange('');
                        setOpen(false);
                      }}
                      className="flex-1 rounded-lg py-1.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/12"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </motion.div>
            </RadixPopover.Content>
          </RadixPopover.Portal>
        )}
      </AnimatePresence>
    </RadixPopover.Root>
  );
};
