'use client';

import { createContext, useContext } from 'react';

/**
 * What a `Field` tells the control inside it: the id its label points at, the
 * ids of its hint and error, and whether it is invalid or required. Every
 * control in this package reads it, so `<Field label error><Input /></Field>`
 * is fully wired for screen readers without the caller passing an id.
 */
export interface FieldContextValue {
  id: string;
  /** The label's id, for controls that are not labelable elements (radio groups). */
  labelId?: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}

export const FieldContext = createContext<FieldContextValue | null>(null);

export interface FieldControlProps {
  id?: string;
  invalid?: boolean;
  required?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
}

/**
 * Accessibility attributes for a control, merging its own props with the
 * surrounding Field. A control's own props win, so a control used outside a
 * Field (or wired by hand) behaves exactly as before.
 */
export function useFieldControl(props: FieldControlProps) {
  const field = useContext(FieldContext);
  const invalid =
    props.invalid ??
    (props['aria-invalid'] === true || props['aria-invalid'] === 'true'
      ? true
      : (field?.invalid ?? false));
  const describedBy =
    [props['aria-describedby'], field?.describedBy].filter(Boolean).join(' ') || undefined;
  return {
    id: props.id ?? field?.id,
    labelId: field?.labelId,
    invalid,
    required: props.required ?? field?.required ?? false,
    ariaProps: {
      'aria-invalid': invalid || undefined,
      'aria-describedby': describedBy,
      'aria-required': (props.required ?? field?.required) || undefined,
    },
  };
}
