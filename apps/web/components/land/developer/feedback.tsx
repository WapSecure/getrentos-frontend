'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { Field, Input, Toast, type ToastVariant } from '@getrentos/ui';

export type Notify = (message: string, variant?: ToastVariant) => void;

/** One toast at a time for a screen; render `toast` once and hand `notify` down. */
export const useNotify = (): { notify: Notify; toast: ReactNode } => {
  const [current, setCurrent] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const notify = useCallback<Notify>(
    (message, variant = 'success') => setCurrent({ message, variant }),
    []
  );
  const toast = current ? (
    <Toast message={current.message} variant={current.variant} onClose={() => setCurrent(null)} />
  ) : null;
  return { notify, toast };
};

/** The message of whatever a mutation threw; the API writes these for people. */
export const errorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
) => (error instanceof Error && error.message ? error.message : fallback);

interface DocumentReferenceFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: ReactNode;
}

/**
 * A property document, by reference.
 *
 * The API takes the id of a document already on the property, but there is no
 * owner endpoint that lists a property's documents yet, so this cannot be a
 * picker. Compliance or support can supply the reference; leave it blank to
 * skip.
 */
export const DocumentReferenceField = ({
  id,
  label,
  value,
  onChange,
  hint,
}: DocumentReferenceFieldProps) => (
  <Field
    label={label}
    htmlFor={id}
    hint={
      hint ??
      'Optional. The reference of a document already filed on this property. Leave blank to skip.'
    }
  >
    <Input
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Document reference"
      autoComplete="off"
    />
  </Field>
);
