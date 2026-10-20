'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@getrentos/shared';

export interface ToggleChipProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'type' | 'onClick'
> {
  children: ReactNode;
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  icon?: ReactNode;
  /** A number after the label ("Open 4"), read out with it. */
  count?: number;
  size?: 'sm' | 'md';
}

/**
 * An on/off chip: filters ("Corner plots"), multi-select options (property
 * types, days of the week) and single-choice chip rows that scroll. Several
 * chips in a row sit in a container with `role="group"` and an aria-label.
 * For two to four mutually exclusive views, use SegmentedControl.
 */
export const ToggleChip = forwardRef<HTMLButtonElement, ToggleChipProps>(
  (
    { children, pressed, onPressedChange, icon, count, size = 'md', className, disabled, ...rest },
    ref
  ) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'min-h-8 px-3 text-xs' : 'min-h-9 px-3.5 text-sm',
        pressed
          ? 'border-primary bg-accent text-primary'
          : 'border-border bg-card text-foreground hover:border-foreground/25 hover:bg-secondary',
        className
      )}
      {...rest}
    >
      {icon && (
        <span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
      {count !== undefined && (
        <span
          className={cn(
            'rounded-full px-1.5 text-xs tabular-nums',
            pressed ? 'bg-primary/15' : 'bg-secondary text-muted-foreground'
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
);
ToggleChip.displayName = 'ToggleChip';
