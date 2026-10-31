'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { format, parse } from 'date-fns';
import { cn } from '@getrentos/shared';
import { controlShell, type ControlSize } from './controlStyles';
import { useFieldControl } from './fieldContext';

interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  step?: number;
  /** Earliest hour to offer (0–24). Defaults to 0 (midnight). */
  minHour?: number;
  /** Latest hour to offer, exclusive (0–24). Defaults to 24 (whole day). */
  maxHour?: number;
  disabled?: boolean;
  className?: string;
  /** Trigger id; inside a Field the field supplies it. */
  id?: string;
  invalid?: boolean;
  required?: boolean;
  ariaLabel?: string;
  controlSize?: ControlSize;
}

const buildTimeOptions = (step: number, minHour: number, maxHour: number) => {
  const options: { value: string; label: string }[] = [];
  const start = Math.max(0, Math.min(24, minHour)) * 60;
  const end = Math.max(0, Math.min(24, maxHour)) * 60;
  for (let minutes = start; minutes < end; minutes += step) {
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
  minHour = 0,
  maxHour = 24,
  disabled,
  className,
  id,
  invalid,
  required,
  ariaLabel,
  controlSize,
}: TimePickerProps) => {
  const field = useFieldControl({ id, invalid, required });
  const [open, setOpen] = useState(false);
  const [options] = useState(() => buildTimeOptions(step, minHour, maxHour));
  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const valueId = `${baseId}-value`;
  const listboxId = `${baseId}-listbox`;
  const hasSelected = options.some((option) => option.value === value);

  // Open on the chosen time (or the first slot) with focus on it, so arrows work at once.
  // Runs from onOpenAutoFocus: the list is portaled and only exists by then.
  const focusInitialOption = () => {
    const list = listRef.current;
    const target =
      list?.querySelector<HTMLButtonElement>('[aria-selected="true"]') ??
      list?.querySelector<HTMLButtonElement>('[role="option"]');
    target?.scrollIntoView({ block: 'center' });
    target?.focus({ preventScroll: true });
  };

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []
    );
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    let next = -1;
    if (event.key === 'ArrowDown') next = Math.min(items.length - 1, index + 1);
    else if (event.key === 'ArrowUp') next = Math.max(0, index - 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    if (next < 0) return;
    event.preventDefault();
    items[next]?.focus();
    items[next]?.scrollIntoView({ block: 'nearest' });
  };

  const selectedLabel = value ? format(parse(value, 'HH:mm', new Date()), 'h:mm a') : null;

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    // Modal, so Tab stays in the list (it is portaled) and a pick or Escape
    // returns focus to the trigger.
    <RadixPopover.Root open={open} onOpenChange={setOpen} modal>
      <RadixPopover.Trigger asChild>
        <button
          type="button"
          id={field.id}
          disabled={disabled}
          // A combobox, so the required/invalid state from a Field is valid ARIA.
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-label={
            ariaLabel && !field.labelId ? `${ariaLabel}: ${selectedLabel ?? placeholder}` : undefined
          }
          aria-labelledby={field.labelId ?? (ariaLabel ? undefined : valueId)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setOpen(true);
            }
          }}
          {...field.ariaProps}
          className={cn(
            'flex items-center justify-between gap-2 text-left',
            controlShell({ size: controlSize, invalid: field.invalid, disabled }),
            className
          )}
        >
          <span
            id={valueId}
            className={cn(
              'truncate tabular-nums',
              selectedLabel ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {selectedLabel ?? placeholder}
          </span>
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </RadixPopover.Trigger>

      <AnimatePresence>
        {open && (
          <RadixPopover.Portal forceMount>
            <RadixPopover.Content
              asChild
              sideOffset={8}
              align="start"
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                focusInitialOption();
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="z-[70] w-52 overflow-hidden rounded-2xl border border-border bg-card shadow-lg focus:outline-none"
              >
                <div className="border-b border-border bg-secondary/55 px-3 py-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Time
                  </p>
                  <p
                    aria-live="polite"
                    className="mt-0.5 text-lg font-semibold tabular-nums tracking-[-0.03em] text-foreground"
                  >
                    {selectedLabel ?? placeholder}
                  </p>
                </div>
                <div
                  ref={listRef}
                  id={listboxId}
                  role="listbox"
                  aria-label={ariaLabel ?? 'Times'}
                  onKeyDown={onListKeyDown}
                  className="max-h-56 overflow-y-auto overscroll-contain p-1.5"
                >
                  {options.map((option, index) => {
                    const isSelected = option.value === value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={isSelected || (!hasSelected && index === 0) ? 0 : -1}
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                          'w-full rounded-lg px-3 py-2 text-left text-sm tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
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
