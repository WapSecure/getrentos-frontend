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
            'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-card text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed',
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
                className="z-50 w-72 rounded-lg border border-border bg-card p-3 shadow-lg focus:outline-none"
              >
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => setViewMonth((m) => subMonths(m, 1))}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-foreground">
                    {format(viewMonth, 'MMMM yyyy')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewMonth((m) => addMonths(m, 1))}
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-1">
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
                          'h-8 w-8 rounded-lg text-sm transition-colors flex items-center justify-center',
                          isSameMonth(day, viewMonth) ? 'text-foreground' : 'text-muted-foreground',
                          isSelected
                            ? 'bg-primary text-primary-foreground font-medium'
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
                  className="mt-3 w-full text-center text-xs font-medium text-primary hover:underline py-1"
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
