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
            'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-card text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed',
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
                className="z-50 w-40 rounded-lg border border-border bg-card p-1.5 shadow-lg focus:outline-none max-h-64 overflow-y-auto"
              >
                {options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      ref={isSelected ? selectedRef : undefined}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        'w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors',
                        isSelected
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-foreground hover:bg-secondary'
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </motion.div>
            </RadixPopover.Content>
          </RadixPopover.Portal>
        )}
      </AnimatePresence>
    </RadixPopover.Root>
  );
};
