'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@getrentos/shared';
import { controlShell, innerInputClass, type ControlSize } from './controlStyles';
import { useFieldControl } from './fieldContext';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** Styles for the native input rather than its visual shell. */
  inputClassName?: string;
  /** Marks the control invalid. Inside a Field, its `error` does this for you. */
  invalid?: boolean;
  controlSize?: ControlSize;
}

/**
 * Single-line text input. Inside a `Field` it takes its id, description and
 * invalid state from the field; outside one, pass `id` / `invalid` yourself.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      inputClassName,
      leadingIcon,
      trailingIcon,
      disabled,
      readOnly,
      invalid,
      controlSize,
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
    return (
      <span
        className={cn(
          'group flex items-center gap-2',
          controlShell({
            size: controlSize,
            invalid: field.invalid,
            disabled,
            readOnly,
            wraps: true,
          }),
          className
        )}
      >
        {leadingIcon && <span className="shrink-0 text-muted-foreground">{leadingIcon}</span>}
        <input
          ref={ref}
          id={field.id}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          {...field.ariaProps}
          className={cn(innerInputClass, inputClassName)}
          {...props}
        />
        {trailingIcon && <span className="shrink-0 text-muted-foreground">{trailingIcon}</span>}
      </span>
    );
  }
);

Input.displayName = 'Input';
