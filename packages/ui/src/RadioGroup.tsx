'use client';

import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@sureground/shared';
import { useFieldControl } from './fieldContext';

export interface RadioOption<T extends string = string> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  tone?: RadioTone;
}

export type RadioTone = 'primary' | 'neutral' | 'success' | 'warning' | 'destructive' | 'info';

// Written out in full: Tailwind only generates classes it finds as literals.
const TONE = {
  primary: {
    dot: 'border-primary bg-primary',
    card: 'border-primary bg-primary/[0.04] shadow-[inset_0_0_0_1px_var(--primary)]',
  },
  neutral: {
    dot: 'border-foreground/60 bg-foreground/60',
    card: 'border-foreground/40 bg-secondary shadow-[inset_0_0_0_1px_var(--border)]',
  },
  success: {
    dot: 'border-success bg-success',
    card: 'border-success bg-success-subtle shadow-[inset_0_0_0_1px_var(--success)]',
  },
  warning: {
    dot: 'border-warning bg-warning',
    card: 'border-warning bg-warning-subtle shadow-[inset_0_0_0_1px_var(--warning)]',
  },
  destructive: {
    dot: 'border-destructive bg-destructive',
    card: 'border-destructive bg-destructive-subtle shadow-[inset_0_0_0_1px_var(--destructive)]',
  },
  info: {
    dot: 'border-info bg-info',
    card: 'border-info bg-info-subtle shadow-[inset_0_0_0_1px_var(--info)]',
  },
} as const;

interface RadioGroupProps<T extends string> {
  value: T | '' | undefined;
  onValueChange: (value: T) => void;
  options: readonly RadioOption<T>[];
  variant?: 'list' | 'card';
  orientation?: 'vertical' | 'horizontal';
  columns?: 1 | 2 | 3;
  disabled?: boolean;
  /** Use `manual` when choosing saves straight away, so arrowing past an option doesn't send it. */
  activation?: 'automatic' | 'manual';
  id?: string;
  invalid?: boolean;
  required?: boolean;
  'aria-label'?: string;
  className?: string;
}

const COLUMNS = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3' } as const;

export function RadioGroup<T extends string>({
  value,
  onValueChange,
  options,
  variant = 'list',
  orientation = 'vertical',
  columns = 1,
  disabled,
  activation = 'automatic',
  id,
  invalid,
  required,
  'aria-label': ariaLabel,
  className,
}: RadioGroupProps<T>) {
  const field = useFieldControl({ id, invalid, required });
  const autoId = useId();
  const groupId = field.id ?? `radio-${autoId}`;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.map((o) => !(disabled || o.disabled));
  const selectedIndex = options.findIndex((o) => o.value === value);
  const tabStop =
    selectedIndex >= 0 && enabled[selectedIndex] ? selectedIndex : enabled.indexOf(true);

  const move = (from: number, delta: number) => {
    for (let step = 1; step <= options.length; step++) {
      const i = (from + delta * step + options.length) % options.length;
      if (enabled[i]) {
        refs.current[i]?.focus();
        if (activation === 'automatic') onValueChange(options[i].value);
        return;
      }
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') move(index, 1);
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') move(index, -1);
    else return;
    event.preventDefault();
  };

  return (
    <div
      id={groupId}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel ? undefined : field.labelId}
      {...field.ariaProps}
      className={cn(
        variant === 'card'
          ? cn('grid gap-2.5', COLUMNS[columns])
          : orientation === 'horizontal'
            ? 'flex flex-wrap gap-x-6 gap-y-3'
            : 'flex flex-col gap-3',
        className
      )}
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        const isDisabled = !enabled[index];
        const descriptionId = option.description ? `${groupId}-${index}-description` : undefined;
        const dot = (
          <span
            aria-hidden="true"
            className={cn(
              'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors duration-150',
              checked
                ? TONE[option.tone ?? 'primary'].dot
                : field.invalid
                  ? 'border-destructive/70 bg-card'
                  : 'border-border bg-card group-enabled:group-hover:border-primary/60'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full bg-primary-foreground transition-transform',
                checked ? 'scale-100' : 'scale-0'
              )}
            />
          </span>
        );
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-describedby={descriptionId}
            disabled={isDisabled}
            tabIndex={index === tabStop ? 0 : -1}
            onClick={() => onValueChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'group text-left focus:outline-none disabled:cursor-not-allowed',
              variant === 'card'
                ? cn(
                    'flex items-start gap-3 rounded-xl border p-4 transition-[border-color,box-shadow,background-color] duration-150',
                    'focus-visible:ring-4 focus-visible:ring-primary/12',
                    checked
                      ? TONE[option.tone ?? 'primary'].card
                      : field.invalid
                        ? 'border-destructive/60 bg-card'
                        : 'border-border bg-card hover:border-primary/40',
                    isDisabled && 'opacity-55'
                  )
                : cn(
                    'flex items-start gap-2.5 rounded-md',
                    'focus-visible:ring-4 focus-visible:ring-primary/20',
                    isDisabled && 'opacity-55'
                  )
            )}
          >
            <span className="flex h-5 items-center">{dot}</span>
            {option.icon && (
              <span
                aria-hidden="true"
                className="flex h-5 shrink-0 items-center text-muted-foreground"
              >
                {option.icon}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium leading-5 text-foreground">
                {option.label}
              </span>
              {option.description && (
                <span
                  id={descriptionId}
                  className="mt-0.5 block text-[13px] leading-5 text-muted-foreground"
                >
                  {option.description}
                </span>
              )}
            </span>
            {option.aside && (
              <span className="shrink-0 text-sm font-medium text-foreground">{option.aside}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
