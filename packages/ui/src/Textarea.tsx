'use client';

import { forwardRef, useState, type TextareaHTMLAttributes } from 'react';
import { cn } from '@getrentos/shared';
import { controlShell } from './controlStyles';
import { useFieldControl } from './fieldContext';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  /** Show "120 / 2000" under the box when a maxLength is set. */
  showCount?: boolean;
}

/** Multi-line text. Reads its id, description and invalid state from a surrounding Field. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      disabled,
      readOnly,
      invalid,
      showCount,
      id,
      required,
      maxLength,
      value,
      defaultValue,
      onChange,
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
    // Uncontrolled boxes have no value prop, so count what has been typed.
    const [typed, setTyped] = useState(() => String(defaultValue ?? '').length);
    const length = typeof value === 'string' ? value.length : typed;
    // Announce the count only near the limit, not on every keystroke.
    const nearLimit = maxLength ? length >= maxLength * 0.9 : false;
    const box = (
      <textarea
        ref={ref}
        id={field.id}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => {
          setTyped(event.target.value.length);
          onChange?.(event);
        }}
        {...field.ariaProps}
        className={cn(
          controlShell({ invalid: field.invalid, disabled, readOnly }),
          'block min-h-24 resize-y py-2.5 leading-6 placeholder:text-muted-foreground',
          className
        )}
        {...props}
      />
    );
    if (!showCount || !maxLength) return box;
    return (
      <div className="space-y-1">
        {box}
        <p
          className={cn(
            'text-right text-xs tabular-nums',
            length >= maxLength ? 'text-destructive' : 'text-muted-foreground'
          )}
          aria-live={nearLimit ? 'polite' : 'off'}
        >
          {length.toLocaleString()} / {maxLength.toLocaleString()}
        </p>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
