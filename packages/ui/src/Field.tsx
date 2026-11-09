'use client';

import { useId, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@sureground/shared';
import { FieldContext } from './fieldContext';

interface FieldProps {
  label: ReactNode;
  children: ReactNode;
  /** Omit it: the Field makes one and hands it to the control. */
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  optionalLabel?: ReactNode;
  labelAside?: ReactNode;
  className?: string;
}

export function Field({
  label,
  children,
  htmlFor,
  hint,
  error,
  required,
  optionalLabel,
  labelAside,
  className,
}: FieldProps) {
  const autoId = useId();
  const id = htmlFor ?? `field-${autoId}`;
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error || hint);

  return (
    <FieldContext.Provider
      value={{
        id,
        labelId: `${id}-label`,
        describedBy: hasMessage ? messageId : undefined,
        invalid: Boolean(error),
        required: Boolean(required),
      }}
    >
      <div className={cn('space-y-1.5', className)}>
        <div className="flex items-baseline justify-between gap-3">
          <label
            id={`${id}-label`}
            htmlFor={id}
            className="block text-sm font-medium tracking-[-0.01em] text-foreground"
          >
            {label}
            {required && (
              <span className="ml-0.5 text-destructive" aria-hidden="true">
                *
              </span>
            )}
            {!required && optionalLabel && (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                {' '}
                {optionalLabel}
              </span>
            )}
          </label>
          {labelAside && <div className="shrink-0 text-xs text-muted-foreground">{labelAside}</div>}
        </div>
        {children}
        {hasMessage && (
          <p
            id={messageId}
            className={cn(
              'flex items-start gap-1.5 text-xs leading-5',
              error ? 'text-destructive' : 'text-muted-foreground'
            )}
            role={error ? 'alert' : undefined}
          >
            {error && <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
            <span>{error ?? hint}</span>
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}
