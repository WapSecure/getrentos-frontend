'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@getrentos/shared';
import { controlShell, innerInputClass } from './controlStyles';
import { useFieldControl } from './fieldContext';

export interface CurrencyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'defaultValue' | 'prefix'
> {
  /** The raw numeric value (submitted to the backend). Accepts number or numeric string. */
  value: number | string;
  /** Called with the raw numeric value (no formatting). */
  onValueChange: (value: number) => void;
  /** Currency symbol shown before the number, e.g. "₦". */
  prefix?: string;
  /** Show 0 as "0" rather than an empty box. Off by default, so a fresh form shows its placeholder. */
  allowZero?: boolean;
  /** Typing past this is ignored. */
  maxValue?: number;
  /** Marks the control invalid. Inside a Field, its `error` does this for you. */
  invalid?: boolean;
}

/**
 * Money input: digits only (letters, signs and decimals cannot be typed or
 * pasted), shown with thousands separators as the user types (1,500,000) while
 * the raw whole number goes to the form.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      onValueChange,
      prefix,
      allowZero = false,
      maxValue,
      invalid,
      className,
      placeholder,
      disabled,
      readOnly,
      id,
      required,
      'aria-describedby': describedBy,
      'aria-invalid': ariaInvalid,
      ...props
    },
    ref
  ) => {
    const field = useFieldControl({
      id,
      invalid,
      required,
      'aria-describedby': describedBy,
      'aria-invalid': ariaInvalid,
    });
    const empty = value === '' || value == null;
    const numeric = typeof value === 'number' ? value : Number(value) || 0;
    const display =
      empty || Number.isNaN(numeric) || (numeric === 0 && !allowZero)
        ? ''
        : numeric.toLocaleString('en-US');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '');
      const next = digits === '' ? 0 : Number(digits);
      if (maxValue != null && next > maxValue) return;
      onValueChange(next);
    };

    return (
      <span
        className={cn(
          'group flex items-center gap-1.5',
          controlShell({ invalid: field.invalid, disabled, readOnly, wraps: true }),
          className
        )}
      >
        {prefix && (
          <span className="shrink-0 text-sm font-medium text-muted-foreground" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={field.id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={display}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          {...field.ariaProps}
          className={cn(innerInputClass, 'tabular-nums')}
          {...props}
        />
      </span>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
