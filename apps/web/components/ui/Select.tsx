'use client';

import { useMemo, useState, type ReactNode } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface SelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function Select({ value, onValueChange, options, placeholder = 'Select an option', disabled, ariaLabel, className }: SelectProps) {
  const selected = useMemo(() => options.find((option) => option.value === value), [options, value]);
  const [open, setOpen] = useState(false);

  return (
    <RadixPopover.Root open={open} onOpenChange={setOpen}>
      <RadixPopover.Trigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
        className={cn(
          'flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 text-left text-sm text-foreground shadow-[0_1px_1px_rgba(0,0,0,0.02)] outline-none transition-[border-color,box-shadow] duration-150',
          'focus:border-primary/70 focus:ring-4 focus:ring-primary/12 data-[placeholder]:text-muted-foreground disabled:cursor-not-allowed disabled:bg-secondary/60 disabled:opacity-60',
          className
        )}
        >
        <span className={selected ? undefined : 'text-muted-foreground'}>{selected?.label ?? placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content sideOffset={6} align="start" className="z-[70] max-h-72 min-w-[var(--radix-popover-trigger-width)] overflow-auto rounded-xl border border-border bg-card p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
          <div role="listbox" aria-label={ariaLabel}>
            {options.map((option) => (
              <button
                key={option.value}
                disabled={option.disabled}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => { onValueChange(option.value); setOpen(false); }}
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-9 text-left text-sm text-foreground outline-none transition-colors hover:bg-secondary focus:bg-secondary disabled:pointer-events-none disabled:opacity-45',
                  option.value === value && 'font-medium'
                )}
              >
                {option.label}
                {option.value === value && <span className="absolute right-3 inline-flex items-center text-primary"><Check className="h-4 w-4" /></span>}
              </button>
            ))}
          </div>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
