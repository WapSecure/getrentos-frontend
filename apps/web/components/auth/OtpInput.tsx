'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@sureground/shared';
import { VALIDATION_PATTERNS } from '@/lib/constants/auth';

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  length?: number;
  disabled?: boolean;
  onComplete?: (value: string) => void;
  label?: string;
  autoFocus?: boolean;
  invalid?: boolean;
  /** Change it to put focus back in the first box, for example after a wrong code. */
  focusSignal?: number;
  describedBy?: string;
}

const digitsOnly = (value: string) => value.replace(VALIDATION_PATTERNS.NON_DIGITS, '');

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  onComplete,
  label = 'Verification code',
  autoFocus = false,
  invalid = false,
  focusSignal,
  describedBy,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = [...value, ...Array(length).fill('')].slice(0, length);

  useEffect(() => {
    if (autoFocus || focusSignal !== undefined) inputRefs.current[0]?.focus();
  }, [autoFocus, focusSignal]);

  const commit = (nextDigits: string[], focusIndex?: number) => {
    onChange(nextDigits);
    if (!nextDigits.includes('')) onComplete?.(nextDigits.join(''));
    if (focusIndex !== undefined) inputRefs.current[focusIndex]?.focus();
  };

  const applyDigits = (index: number, incoming: string) => {
    if (!incoming) return;
    const nextDigits = [...digits];
    incoming
      .slice(0, length - index)
      .split('')
      .forEach((digit, offset) => {
        nextDigits[index + offset] = digit;
      });
    commit(nextDigits, Math.min(index + incoming.length, length - 1));
  };

  // Typing into a filled box replaces its digit rather than spilling into the next box.
  const onInput = (index: number, rawValue: string) => {
    const typed = digitsOnly(rawValue);
    const current = digits[index];
    if (current && typed.length === 2) {
      applyDigits(index, typed[0] === current ? typed[1] : typed[0]);
      return;
    }
    applyDigits(index, typed);
  };

  return (
    <div
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
      className="flex w-full justify-center gap-1.5 sm:gap-2"
    >
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
          aria-invalid={invalid || undefined}
          value={digit}
          disabled={disabled}
          onFocus={(event) => event.target.select()}
          onChange={(event) => onInput(index, event.target.value)}
          onPaste={(event) => {
            event.preventDefault();
            applyDigits(index, digitsOnly(event.clipboardData.getData('text')));
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
            } else if (event.key === 'Delete') {
              event.preventDefault();
              const nextDigits = [...digits];
              nextDigits[index] = '';
              commit(nextDigits, index);
            } else if (event.key === 'ArrowLeft' && index > 0) {
              event.preventDefault();
              inputRefs.current[index - 1]?.focus();
            } else if (event.key === 'ArrowRight' && index < length - 1) {
              event.preventDefault();
              inputRefs.current[index + 1]?.focus();
            }
          }}
          className={cn(
            'h-12 min-w-0 max-w-[3rem] flex-1 rounded-xl border bg-card text-center text-xl font-semibold text-foreground transition-[border-color,box-shadow] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50',
            invalid ? 'border-destructive/70' : 'border-border'
          )}
          maxLength={length}
        />
      ))}
    </div>
  );
}
