'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@getrentos/shared';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Visible label, shown to the left of the switch as a settings row. */
  label?: ReactNode;
  description?: ReactNode;
  size?: 'sm' | 'md';
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
  className,
  label,
  description,
  size = 'md',
  'aria-describedby': describedBy,
  ...props
}: SwitchProps) {
  const autoId = useId();
  const switchId = id ?? `switch-${autoId}`;
  const labelId = `${switchId}-label`;
  const descriptionId = `${switchId}-description`;

  const control = (
    <button
      id={switchId}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={label ? labelId : undefined}
      aria-describedby={cn(description && descriptionId, describedBy) || undefined}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative shrink-0 rounded-full p-0.5 transition-colors duration-200',
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-5 w-9' : 'h-7 w-12',
        checked ? 'bg-success' : 'bg-border',
        !label && className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'block rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none',
          size === 'sm' ? 'h-4 w-4' : 'h-6 w-6',
          checked && (size === 'sm' ? 'translate-x-4' : 'translate-x-5')
        )}
      />
    </button>
  );

  if (!label) return control;

  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0 flex-1">
        <span
          id={labelId}
          onClick={() => !disabled && onCheckedChange(!checked)}
          className={cn(
            'block text-sm font-medium leading-5',
            disabled
              ? 'cursor-not-allowed text-muted-foreground'
              : 'cursor-pointer select-none text-foreground'
          )}
        >
          {label}
        </span>
        {description && (
          <p id={descriptionId} className="mt-0.5 text-[13px] leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {control}
    </div>
  );
}
