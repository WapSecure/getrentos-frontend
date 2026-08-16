'use client';

import { cn } from '@getrentos/shared';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
  className,
  ...props
}: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative h-7 w-12 rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-success' : 'bg-border',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'block h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked && 'translate-x-5'
        )}
      />
    </button>
  );
}
