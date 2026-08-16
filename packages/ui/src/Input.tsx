'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@getrentos/shared';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** Styles for the native input rather than its visual shell. */
  inputClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputClassName, leadingIcon, trailingIcon, disabled, ...props }, ref) => (
    <span
      className={cn(
        'group flex min-h-11 w-full items-center gap-2 rounded-xl border border-border bg-card px-3.5 transition-[border-color,background-color,box-shadow] duration-150',
        'hover:border-foreground/20',
        'focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/12',
        disabled && 'cursor-not-allowed bg-secondary/60 opacity-60 hover:border-border',
        className
      )}
    >
      {leadingIcon && <span className="shrink-0 text-muted-foreground">{leadingIcon}</span>}
      <input
        ref={ref}
        disabled={disabled}
        className={cn(
          'min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground focus:shadow-none',
          inputClassName
        )}
        {...props}
      />
      {trailingIcon && <span className="shrink-0 text-muted-foreground">{trailingIcon}</span>}
    </span>
  )
);

Input.displayName = 'Input';
