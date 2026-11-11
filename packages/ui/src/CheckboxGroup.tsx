'use client';

import { useId, type ReactNode } from 'react';
import { AlertCircle } from '@sureground/icons';
import { cn } from '@sureground/shared';
import { Checkbox } from './Checkbox';

export interface CheckboxOption<T extends string = string> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

interface CheckboxGroupProps<T extends string> {
  /** The group's question. Always read out; `hideLegend` only hides it on screen. */
  legend: ReactNode;
  hideLegend?: boolean;
  value: readonly T[];
  onValueChange: (value: T[]) => void;
  options: readonly CheckboxOption<T>[];
  orientation?: 'vertical' | 'horizontal';
  /** Lays the options out in a grid; wins over `orientation`. */
  columns?: 1 | 2 | 3 | 4;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  optionalLabel?: ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const COLUMNS = {
  1: '',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
} as const;

// Grows each box's hit area to 44px on touch screens without moving the layout.
const TOUCH_TARGET =
  'pointer-coarse:min-h-11 pointer-coarse:[&_[role=checkbox]]:relative pointer-coarse:[&_[role=checkbox]]:after:absolute pointer-coarse:[&_[role=checkbox]]:after:-inset-3';

export function CheckboxGroup<T extends string>({
  legend,
  hideLegend = false,
  value,
  onValueChange,
  options,
  orientation = 'vertical',
  columns,
  hint,
  error,
  required,
  optionalLabel,
  disabled,
  id,
  className,
}: CheckboxGroupProps<T>) {
  const autoId = useId();
  const groupId = id ?? `checkbox-group-${autoId}`;
  const messageId = `${groupId}-message`;
  const hasMessage = Boolean(error || hint);
  const invalid = Boolean(error);

  // Ticked values keep the order they were ticked in.
  const toggle = (option: T, on: boolean) =>
    onValueChange(
      on
        ? [...value.filter((item) => item !== option), option]
        : value.filter((item) => item !== option)
    );

  return (
    <fieldset
      id={groupId}
      aria-describedby={hasMessage ? messageId : undefined}
      disabled={disabled}
      className={cn('min-w-0', className)}
    >
      <legend
        className={cn(
          hideLegend
            ? 'sr-only'
            : 'mb-2 block p-0 text-sm font-medium tracking-[-0.01em] text-foreground'
        )}
      >
        {legend}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
        {!required && optionalLabel && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground"> {optionalLabel}</span>
        )}
      </legend>
      <div
        className={cn(
          columns && columns > 1
            ? cn('grid gap-3', COLUMNS[columns])
            : orientation === 'horizontal'
              ? 'flex flex-wrap gap-x-6 gap-y-3'
              : 'flex flex-col gap-3'
        )}
      >
        {options.map((option) => (
          <div key={option.value} className={cn('flex items-center', TOUCH_TARGET)}>
            <Checkbox
              checked={value.includes(option.value)}
              onCheckedChange={(on) => toggle(option.value, on)}
              label={option.label}
              description={option.description}
              disabled={disabled || option.disabled}
              invalid={invalid}
            />
          </div>
        ))}
      </div>
      {hasMessage && (
        <p
          id={messageId}
          className={cn(
            'mt-2 flex items-start gap-1.5 text-xs leading-5',
            error ? 'text-destructive' : 'text-muted-foreground'
          )}
          role={error ? 'alert' : undefined}
        >
          {error && <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          <span>{error ?? hint}</span>
        </p>
      )}
    </fieldset>
  );
}
