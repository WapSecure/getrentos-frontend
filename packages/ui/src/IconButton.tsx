'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@getrentos/shared';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Required: an icon alone has no name for a screen reader. Also shown as the tooltip. */
  label: string;
  icon: ReactNode;
  variant?: 'ghost' | 'outline' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const VARIANTS = {
  ghost: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
  outline:
    'border border-border bg-card text-foreground shadow-xs hover:border-foreground/25 hover:bg-secondary/60',
  secondary:
    'border border-border/70 bg-secondary text-secondary-foreground hover:bg-foreground/[0.05]',
  danger: 'text-destructive hover:bg-destructive-subtle',
} as const;

// The smallest still meets a 32px target; md and lg reach the 40–44px touch size.
const SIZES = {
  sm: 'h-8 w-8 [&_svg]:h-4 [&_svg]:w-4',
  md: 'h-10 w-10 [&_svg]:h-[18px] [&_svg]:w-[18px]',
  lg: 'h-11 w-11 [&_svg]:h-5 [&_svg]:w-5',
} as const;

/** A square, icon-only button: close, more, edit, delete in a row. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      label,
      icon,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      className,
      disabled,
      type,
      title,
      ...rest
    },
    ref
  ) => (
    <button
      {...rest}
      ref={ref}
      type={type ?? 'button'}
      aria-label={rest['aria-label'] ?? label}
      title={title ?? label}
      aria-busy={isLoading || undefined}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg transition-[background-color,border-color,color] duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
        />
      ) : (
        <span aria-hidden="true" className="inline-flex">
          {icon}
        </span>
      )}
    </button>
  )
);

IconButton.displayName = 'IconButton';
