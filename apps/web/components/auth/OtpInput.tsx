'use client';

import { useRef } from 'react';
import { VALIDATION_PATTERNS } from '@/lib/constants/auth';

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  length?: number;
  disabled?: boolean;
  onComplete?: (value: string) => void;
}

const digitsOnly = (value: string) => value.replace(VALIDATION_PATTERNS.NON_DIGITS, '');

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  onComplete,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = [...value, ...Array(length).fill('')].slice(0, length);

  const commit = (nextDigits: string[], focusIndex?: number) => {
    onChange(nextDigits);
    if (!nextDigits.includes('')) onComplete?.(nextDigits.join(''));
    if (focusIndex !== undefined) inputRefs.current[focusIndex]?.focus();
  };

  const applyDigits = (index: number, rawValue: string) => {
    const pastedDigits = digitsOnly(rawValue);
    if (!pastedDigits) return;
    const nextDigits = [...digits];
    pastedDigits.slice(0, length - index).split('').forEach((digit, offset) => {
      nextDigits[index + offset] = digit;
    });
    commit(nextDigits, Math.min(index + pastedDigits.length, length - 1));
  };

  return (
    <div className="flex justify-center gap-2" aria-label="Verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1} of ${length}`}
          value={digit}
          disabled={disabled}
          onChange={(event) => applyDigits(index, event.target.value)}
          onPaste={(event) => {
            event.preventDefault();
            applyDigits(index, event.clipboardData.getData('text'));
          }}
          onKeyDown={(event) => {
            if (event.key === 'Backspace') {
              event.preventDefault();
              const nextDigits = [...digits];
              if (nextDigits[index]) {
                nextDigits[index] = '';
                commit(nextDigits, index);
              } else if (index > 0) {
                nextDigits[index - 1] = '';
                commit(nextDigits, index - 1);
              }
            }
            if (event.key === 'Delete') {
              event.preventDefault();
              const nextDigits = [...digits];
              nextDigits[index] = '';
              commit(nextDigits, index);
            }
          }}
          className="w-12 h-12 text-center text-xl font-semibold border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
          maxLength={length}
        />
      ))}
    </div>
  );
}
