'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/Input';

/**
 * Safe bridge for existing input markup. Ordinary fields use the digital Input
 * shell; file, checkbox, and radio inputs retain native semantics required by
 * browsers, password managers, uploads, and form validation.
 */
export const LegacyInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ type = 'text', className, ...props }, ref) => {
    if (type === 'file' || type === 'checkbox' || type === 'radio') {
      return <input ref={ref} type={type} className={className} {...props} />;
    }

    return <Input ref={ref} type={type} className="w-full" inputClassName={className} {...props} />;
  }
);

LegacyInput.displayName = 'LegacyInput';
