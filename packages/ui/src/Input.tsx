'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn, sanitisePhoneInput } from '@sureground/shared';
import { controlShell, innerInputClass, type ControlSize } from './controlStyles';
import { useFieldControl } from './fieldContext';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  inputClassName?: string;
  /** Inside a Field, its `error` sets this for you. */
  invalid?: boolean;
  controlSize?: ControlSize;
}

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
      onChange,
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
        {leadingIcon && (
          <span
            className={cn(
              'shrink-0 text-muted-foreground transition-colors duration-150',
              !field.invalid && !disabled && 'group-focus-within:text-primary'
            )}
          >
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={field.id}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          {...field.ariaProps}
          className={cn(innerInputClass, inputClassName)}
          inputMode={props.type === 'tel' ? 'tel' : undefined}
          {...props}
          onChange={(e) => {
            if (props.type === 'tel') {
              const clean = sanitisePhoneInput(e.target.value);
              if (clean !== e.target.value) e.target.value = clean;
            }
            onChange?.(e);
          }}
        />
        {trailingIcon && <span className="shrink-0 text-muted-foreground">{trailingIcon}</span>}
      </span>
    );
  }
);

Input.displayName = 'Input';
