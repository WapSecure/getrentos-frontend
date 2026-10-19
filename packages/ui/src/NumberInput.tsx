'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn, VALIDATION_PATTERNS } from '@getrentos/shared';
import { controlShell, innerInputClass } from './controlStyles';
import { useFieldControl } from './fieldContext';

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
  /** Marks the control invalid. Inside a Field, its `error` does this for you. */
  invalid?: boolean;
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
      readOnly,
      invalid,
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
          'group flex items-center gap-2',
          controlShell({ invalid: field.invalid, disabled, readOnly, wraps: true })
        )}
      >
        {leadingIcon && <span className="shrink-0 text-muted-foreground">{leadingIcon}</span>}
        <input
          ref={ref}
          type="text"
          id={field.id}
          inputMode={integer ? 'numeric' : 'decimal'}
          autoComplete="off"
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          {...field.ariaProps}
          value={value == null ? '' : String(value)}
          onChange={handleChange}
          className={cn(
            'tabular-nums',
            innerInputClass,
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
