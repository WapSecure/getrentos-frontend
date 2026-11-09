'use client';

import { createContext, useContext } from 'react';

export interface FieldContextValue {
  id: string;
  /** For controls that are not labelable elements (radio groups). */
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

// A control's own props win over the surrounding Field's.
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
