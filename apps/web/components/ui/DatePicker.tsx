'use client';

import { useState } from 'react';
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
} from 'date-fns';
import { cn } from '@/lib/cn';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
}

const toDate = (value?: string) => (value ? parseISO(value) : undefined);

export const DatePicker = ({
  value,
  onChange,
  placeholder = 'Select date',
  min,
  max,
  disabled,
  className,
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);
  const minDate = toDate(min);
  const maxDate = toDate(max);
  const [viewMonth, setViewMonth] = useState(() => selected ?? new Date());

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const leadingBlanks = getDay(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const isDisabled = (day: Date) =>
    (minDate && isBefore(day, minDate) && !isSameDay(day, minDate)) ||
    (maxDate && isAfter(day, maxDate) && !isSameDay(day, maxDate));

  const handleSelect = (day: Date) => {
    if (isDisabled(day)) return;
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  };

  return (
    <RadixPopover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setViewMonth(selected ?? new Date());
      }}
    >
      <RadixPopover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 text-left text-sm shadow-[0_1px_1px_rgba(0,0,0,0.02)] transition-[border-color,box-shadow] duration-150 focus:border-primary/70 focus:outline-none focus:ring-4 focus:ring-primary/12 disabled:cursor-not-allowed disabled:bg-secondary/60 disabled:opacity-60',
            className
          )}
        >
          <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
            {selected ? format(selected, 'MMM d, yyyy') : placeholder}
          </span>
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
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
                className="z-[70] w-72 rounded-2xl border border-border bg-card p-3 shadow-[0_16px_40px_rgba(0,0,0,0.16)] focus:outline-none"
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
                  <span aria-live="polite" className="text-sm font-semibold tracking-[-0.02em] text-foreground">
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

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: leadingBlanks }).map((_, i) => (
                    <div key={`blank-${i}`} />
                  ))}
                  {days.map((day) => {
                    const isSelected = selected && isSameDay(day, selected);
                    const dayDisabled = isDisabled(day);
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => handleSelect(day)}
                        disabled={dayDisabled}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
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

                <button
                  type="button"
                  onClick={() => handleSelect(new Date())}
                  className="mt-3 w-full rounded-lg py-1.5 text-center text-xs font-medium text-primary transition-colors hover:bg-accent focus:outline-none focus:ring-4 focus:ring-primary/12"
                >
                  Today
                </button>
              </motion.div>
            </RadixPopover.Content>
          </RadixPopover.Portal>
        )}
      </AnimatePresence>
    </RadixPopover.Root>
  );
};
