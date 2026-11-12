'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@sureground/shared';

export interface ToggleChipProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'type' | 'onClick'
> {
  children: ReactNode;
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  icon?: ReactNode;
  count?: number;
  size?: 'sm' | 'md';
}

// Put several in a container with `role="group"` and an aria-label.
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
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border font-medium transition-[background-color,border-color,color] duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'min-h-8 px-3 text-xs' : 'min-h-9 px-3.5 text-sm',
        pressed
          ? 'border-primary/40 bg-primary/10 text-primary hover:border-primary/60'
          : 'border-border bg-card text-foreground hover:border-primary/40 hover:text-primary',
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
            'rounded-sm px-1.5 text-xs tabular-nums',
            pressed ? 'bg-card text-primary' : 'bg-secondary text-muted-foreground'
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
);
ToggleChip.displayName = 'ToggleChip';
