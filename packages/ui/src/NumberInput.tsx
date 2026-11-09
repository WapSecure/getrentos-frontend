'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn, VALIDATION_PATTERNS } from '@sureground/shared';
import { controlShell, innerInputClass } from './controlStyles';
import { useFieldControl } from './fieldContext';

export interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'defaultValue'
> {
  value: string | number;
  onValueChange: (value: string) => void;
  integer?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  inputClassName?: string;
  /** Inside a Field, its `error` sets this for you. */
  invalid?: boolean;
  /** For PINs; not for one-time codes, which people copy from email. */
  masked?: boolean;
}

// Same classes LegacyInput strips, so a legacy className doesn't double up against this shell.
const SHELL_CLASS_RE =
  /^(?:border(?:-[a-zA-Z0-9/%-]+)?|rounded(?:-[a-zA-Z0-9/%-]+)?|bg(?:-[a-zA-Z0-9/%-]+)?|shadow(?:-[a-zA-Z0-9/%-]+)?|outline-none|focus:outline-none|focus:ring(?:-[a-zA-Z0-9/%-]+)?|focus:border(?:-[a-zA-Z0-9/%-]+)?)$/;

const stripShellClasses = (className?: string): string =>
  (className ?? '')
    .split(/\s+/)
    .filter((cls) => cls && !SHELL_CLASS_RE.test(cls))
    .join(' ');

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
      masked = false,
      id,
      required,
      'aria-describedby': describedBy,
      'aria-invalid': ariaInvalid,
      maxLength,
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
        const firstDot = cleaned.indexOf('.');
        if (firstDot !== -1) {
          cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
        }
      }
      // Counts digits: a native maxLength would cut pasted text before it is cleaned.
      onValueChange(maxLength && maxLength > 0 ? cleaned.slice(0, maxLength) : cleaned);
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
          type={masked ? 'password' : 'text'}
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
