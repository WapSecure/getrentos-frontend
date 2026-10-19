'use client';

import { useId, type ReactNode } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@getrentos/shared';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Visible label. With it the whole row is clickable. */
  label?: ReactNode;
  /** Supporting line under the label. */
  description?: ReactNode;
  /** "Some selected" state for a select-all box. Clicking it selects all. */
  indeterminate?: boolean;
  invalid?: boolean;
  required?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  disabled,
  id,
  className,
  label,
  description,
  indeterminate = false,
  invalid,
  required,
  'aria-describedby': describedBy,
  ...props
}: CheckboxProps) {
  const autoId = useId();
  const boxId = id ?? `checkbox-${autoId}`;
  const labelId = `${boxId}-label`;
  const descriptionId = `${boxId}-description`;
  const mixed = indeterminate && !checked;
  const on = checked || mixed;

  const box = (
    <button
      id={boxId}
      type="button"
      role="checkbox"
      aria-checked={mixed ? 'mixed' : checked}
      aria-invalid={invalid || undefined}
      aria-required={required || undefined}
      aria-labelledby={label ? labelId : undefined}
      aria-describedby={cn(description && descriptionId, describedBy) || undefined}
      disabled={disabled}
      onClick={() => onCheckedChange(mixed ? true : !checked)}
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border transition-[background-color,border-color,box-shadow] duration-150',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50',
        on
          ? 'border-primary bg-primary text-primary-foreground'
          : invalid
            ? 'border-destructive/70 bg-card'
            : 'border-border bg-card hover:border-primary/60',
        !label && className
      )}
      {...props}
    >
      {mixed ? (
        <Minus className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
      ) : (
        checked && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
      )}
    </button>
  );

  if (!label) return box;

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <span className="flex h-5 items-center pt-px">{box}</span>
      <div className="min-w-0 flex-1">
        {/* A label element would not forward clicks to a button, so the text toggles directly. */}
        <span
          id={labelId}
          onClick={() => !disabled && onCheckedChange(mixed ? true : !checked)}
          className={cn(
            'block text-sm font-medium leading-5',
            disabled
              ? 'cursor-not-allowed text-muted-foreground'
              : 'cursor-pointer select-none text-foreground'
          )}
        >
          {label}
          {required && (
            <span className="ml-0.5 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </span>
        {description && (
          <p id={descriptionId} className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
