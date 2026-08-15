'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/Input';

/**
 * Safe bridge for existing input markup. Ordinary fields use the digital Input
 * shell; file, checkbox, and radio inputs retain native semantics required by
 * browsers, password managers, uploads, and form validation.
 *
 * The Input shell already owns the border, radius, background, and focus ring,
 * so any shell-level classes (border/rounded/bg/shadow/focus-ring) passed in a
 * legacy className are stripped here to avoid a doubled border. Layout, padding,
 * and text classes are forwarded to the inner input unchanged.
 */
const SHELL_CLASS_RE =
  /^(?:border(?:-[a-zA-Z0-9/%-]+)?|rounded(?:-[a-zA-Z0-9/%-]+)?|bg(?:-[a-zA-Z0-9/%-]+)?|shadow(?:-[a-zA-Z0-9/%-]+)?|outline-none|focus:outline-none|focus:ring(?:-[a-zA-Z0-9/%-]+)?|focus:border(?:-[a-zA-Z0-9/%-]+)?)$/;

const stripShellClasses = (className?: string): string =>
  (className ?? '')
    .split(/\s+/)
    .filter((cls) => cls && !SHELL_CLASS_RE.test(cls))
    .join(' ');

export const LegacyInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ type = 'text', className, ...props }, ref) => {
    if (type === 'file' || type === 'checkbox' || type === 'radio') {
      return <input ref={ref} type={type} className={className} {...props} />;
    }

    return (
      <Input
        ref={ref}
        type={type}
        className="w-full"
        inputClassName={stripShellClasses(className)}
        {...props}
      />
    );
  }
);

LegacyInput.displayName = 'LegacyInput';
