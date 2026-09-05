'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@getrentos/shared';

export interface CurrencyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'defaultValue'
> {
  /** The raw numeric value (submitted to the backend). Accepts number or numeric string. */
  value: number | string;
  /** Called with the raw numeric value (no formatting). */
  onValueChange: (value: number) => void;
  /** Optional currency symbol shown before the formatted number. */
  prefix?: string;
}

/**
 * Text input that formats money with thousands separators as the user types
 * (e.g. `1,500,000`) while keeping the raw number for the payload.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, prefix, className, placeholder, ...props }, ref) => {
    const numeric = typeof value === 'number' ? value : Number(value) || 0;
    const display = Number.isNaN(numeric) || numeric === 0 ? '' : numeric.toLocaleString('en-US');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/[^\d]/g, '');
      onValueChange(digits === '' ? 0 : Number(digits));
    };

    return (
      <div className={cn('relative w-full', !prefix && 'inline-block')}>
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={display}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            className,
            // Gutter for the prefix symbol — applied LAST so callers passing
            // their own px-*/pl-* can never make the typed text overlap the ₦.
            prefix && 'pl-8'
          )}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
