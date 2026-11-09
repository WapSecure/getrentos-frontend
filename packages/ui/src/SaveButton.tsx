'use client';

import { useEffect, useRef, useState } from 'react';
import { Check } from '@sureground/icons';
import { Button } from './Button';

interface SaveButtonProps {
  label?: string;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
  className?: string;
  /** Return the save's promise; "Saved" shows only once it resolves to something other than `false`. */
  onClick?: () => unknown;
  disabled?: boolean;
  isLoading?: boolean;
  /** `secondary` + `sm` for a save inside a row, where a full primary button would shout. */
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md';
  'aria-label'?: string;
}

const isPromise = (value: unknown): value is Promise<unknown> =>
  !!value && typeof (value as Promise<unknown>).then === 'function';

export const SaveButton = ({
  label = 'Save changes',
  type = 'button',
  fullWidth,
  className,
  onClick,
  disabled,
  isLoading,
  variant = 'primary',
  size,
  'aria-label': ariaLabel,
}: SaveButtonProps) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleClick = async () => {
    setSaved(false);
    const result = onClick?.();
    if (!isPromise(result)) return;
    setSaving(true);
    try {
      const outcome = await result;
      if (outcome === false) return;
      setSaved(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setSaved(false), 2000);
    } catch {
      // The caller shows the error; the button just doesn't claim it saved.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      aria-label={saved ? undefined : ariaLabel}
      fullWidth={fullWidth}
      className={className ? `gap-1.5 ${className}` : 'gap-1.5'}
      onClick={() => void handleClick()}
      disabled={disabled}
      isLoading={saving || isLoading}
    >
      {saved && <Check className="h-4 w-4" aria-hidden="true" />}
      {saved ? 'Saved' : label}
    </Button>
  );
};
