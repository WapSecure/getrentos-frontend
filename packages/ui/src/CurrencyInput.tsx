'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@sureground/shared';
import { controlShell, innerInputClass } from './controlStyles';
import { useFieldControl } from './fieldContext';

export interface CurrencyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'defaultValue' | 'prefix'
> {
  value: number | string;
  onValueChange: (value: number) => void;
  prefix?: string;
  /** Off by default, so a fresh form shows its placeholder rather than "0". */
  allowZero?: boolean;
  maxValue?: number;
  /** Inside a Field, its `error` sets this for you. */
  invalid?: boolean;
}

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
