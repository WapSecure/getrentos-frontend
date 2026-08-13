'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** Styles for the native input rather than its visual shell. */
  inputClassName?: string;
}

/** A tactile, system-style text field. Use it instead of styling native inputs per screen. */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputClassName, leadingIcon, trailingIcon, disabled, ...props }, ref) => (
    <span
      className={cn(
        'group flex min-h-11 w-full items-center rounded-xl border border-border bg-card px-3 shadow-[0_1px_1px_rgba(0,0,0,0.02)] transition-[border-color,box-shadow,background-color] duration-150',
        'focus-within:border-primary/70 focus-within:ring-4 focus-within:ring-primary/12',
        disabled && 'cursor-not-allowed bg-secondary/60 opacity-60',
        className
      )}
    >
      {leadingIcon && <span className="mr-2 shrink-0 text-muted-foreground">{leadingIcon}</span>}
      <input
        ref={ref}
        disabled={disabled}
        className={cn('min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground', inputClassName)}
        {...props}
      />
      {trailingIcon && <span className="ml-2 shrink-0 text-muted-foreground">{trailingIcon}</span>}
    </span>
  )
);

Input.displayName = 'Input';
