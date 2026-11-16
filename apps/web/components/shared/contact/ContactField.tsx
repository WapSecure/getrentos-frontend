'use client';

import { useState } from 'react';
import { Field, Input } from '@sureground/ui';
import { readContactInput } from '@sureground/shared';

export function contactIsReady(value: string): boolean {
  const kind = readContactInput(value).kind;
  return kind === 'email' || kind === 'phone';
}

export function ContactField({
  id,
  value,
  onChange,
  label = 'Their phone number or email',
  hint = 'The one they signed up with, for example 0803 123 4567',
  error,
  required,
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  const [touched, setTouched] = useState(false);
  const input = readContactInput(value);
  const localError = touched && input.kind === 'invalid' ? input.message : undefined;
  return (
    <Field label={label} htmlFor={id} hint={hint} error={localError ?? error} required={required}>
      <Input
        id={id}
        type="text"
        inputMode="email"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        autoFocus={autoFocus}
        placeholder="0803 123 4567 or name@example.com"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
      />
    </Field>
  );
}
