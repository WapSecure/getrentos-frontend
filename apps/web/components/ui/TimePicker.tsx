'use client';

import { useEffect, useRef, useState } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/cn';

interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  step?: number;
  disabled?: boolean;
  className?: string;
}

const buildTimeOptions = (step: number) => {
  const options: { value: string; label: string }[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += step) {
    const hours24 = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const value = `${String(hours24).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    const label = format(parse(value, 'HH:mm', new Date()), 'h:mm a');
    options.push({ value, label });
  }
  return options;
};

export const TimePicker = ({
  value,
  onChange,
  placeholder = 'Select time',
  step = 30,
  disabled,
  className,
}: TimePickerProps) => {
  const [open, setOpen] = useState(false);
  const [options] = useState(() => buildTimeOptions(step));
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      selectedRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [open]);

  const selectedLabel = value ? format(parse(value, 'HH:mm', new Date()), 'h:mm a') : null;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 text-left text-sm shadow-[0_1px_1px_rgba(0,0,0,0.02)] transition-[border-color,box-shadow] duration-150 focus:border-primary/70 focus:outline-none focus:ring-4 focus:ring-primary/12 disabled:cursor-not-allowed disabled:bg-secondary/60 disabled:opacity-60',
            className
          )}
        >
          <span className={selectedLabel ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedLabel ?? placeholder}
          </span>
          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
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
                className="z-[70] w-52 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_40px_rgba(0,0,0,0.16)] focus:outline-none"
              >
                <div className="border-b border-border bg-secondary/55 px-3 py-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Time</p>
                  <p aria-live="polite" className="mt-0.5 text-lg font-semibold tracking-[-0.03em] text-foreground">{selectedLabel ?? placeholder}</p>
                </div>
                <div className="max-h-56 overflow-y-auto p-1.5">
                  {options.map((option) => {
                    const isSelected = option.value === value;
                    return (
                      <button
                        key={option.value}
                        ref={isSelected ? selectedRef : undefined}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'text-foreground hover:bg-secondary'
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </RadixPopover.Content>
          </RadixPopover.Portal>
        )}
      </AnimatePresence>
    </RadixPopover.Root>
  );
};
