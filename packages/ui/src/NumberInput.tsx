'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn, VALIDATION_PATTERNS } from '@getrentos/shared';

export interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'defaultValue'
> {
  /** Raw numeric string (or number) held by the form state. */
  value: string | number;
  /** Called with the sanitized numeric string (no thousand separators). */
  onValueChange: (value: string) => void;
  /** When true (default) only whole numbers are allowed; set false to allow decimals. */
  integer?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** Extra classes for the native input rather than its visual shell. */
  inputClassName?: string;
}

/**
 * Shell classes that LegacyInput strips (border/rounded/bg/shadow/focus) so a
 * legacy-style className does not double up against the NumberInput shell.
 */
const SHELL_CLASS_RE =
  /^(?:border(?:-[a-zA-Z0-9/%-]+)?|rounded(?:-[a-zA-Z0-9/%-]+)?|bg(?:-[a-zA-Z0-9/%-]+)?|shadow(?:-[a-zA-Z0-9/%-]+)?|outline-none|focus:outline-none|focus:ring(?:-[a-zA-Z0-9/%-]+)?|focus:border(?:-[a-zA-Z0-9/%-]+)?)$/;

const stripShellClasses = (className?: string): string =>
  (className ?? '')
    .split(/\s+/)
    .filter((cls) => cls && !SHELL_CLASS_RE.test(cls))
    .join(' ');

/**
 * Numeric-only text input. Letters (and any non-digit character) are stripped
 * as the user types, so numbers can never contain alphabets — regardless of
 * keyboard, paste, or autofill. Use `integer={false}` for decimals.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onValueChange,
      integer = true,
      leadingIcon,
      trailingIcon,
      className,
      inputClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      let cleaned = raw.replace(
        integer ? VALIDATION_PATTERNS.NON_DIGITS : VALIDATION_PATTERNS.NON_NUMERIC,
        ''
      );
      if (!integer) {
        // Keep only the first decimal point.
        const firstDot = cleaned.indexOf('.');
        if (firstDot !== -1) {
          cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
        }
      }
      if (cleaned !== raw) onValueChange(cleaned);
      else onValueChange(raw);
    };

    return (
      <span
        className={cn(
          'group flex min-h-11 w-full items-center gap-2 rounded-xl border border-border bg-card px-3.5 transition-[border-color,background-color,box-shadow] duration-150',
          'hover:border-foreground/20',
          'focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/12',
          disabled && 'cursor-not-allowed bg-secondary/60 opacity-60 hover:border-border'
        )}
      >
        {leadingIcon && <span className="shrink-0 text-muted-foreground">{leadingIcon}</span>}
        <input
          ref={ref}
          type="text"
          inputMode={integer ? 'numeric' : 'decimal'}
          autoComplete="off"
          disabled={disabled}
          value={value == null ? '' : String(value)}
          onChange={handleChange}
          className={cn(
            'min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground focus:shadow-none',
            stripShellClasses(className),
            inputClassName
          )}
          {...props}
        />
        {trailingIcon && <span className="shrink-0 text-muted-foreground">{trailingIcon}</span>}
      </span>
    );
  }
);

NumberInput.displayName = 'NumberInput';
