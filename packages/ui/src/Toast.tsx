'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '@getrentos/shared';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

/**
 * How long a toast stays before it closes itself. An acknowledged action can go
 * quickly; an error is worth reading, so it lingers longer.
 */
const DEFAULT_DURATION_MS: Record<ToastVariant, number> = {
  success: 4_000,
  info: 4_000,
  warning: 6_000,
  error: 8_000,
};

interface ToastProps {
  message: string;
  variant: ToastVariant;
  onClose: () => void;
  /**
   * Milliseconds before it closes itself. Pass null to keep it until dismissed,
   * for a message the user has to act on.
   */
  duration?: number | null;
}

// Design tokens, so the toast follows the theme like every other surface.
const variantStyles = {
  success: { icon: CheckCircle, tone: 'bg-success-subtle text-success', bar: 'bg-success' },
  error: { icon: XCircle, tone: 'bg-destructive-subtle text-destructive', bar: 'bg-destructive' },
  info: { icon: Info, tone: 'bg-info-subtle text-info', bar: 'bg-info' },
  warning: { icon: AlertCircle, tone: 'bg-warning-subtle text-warning', bar: 'bg-warning' },
};

export const Toast = ({ message, variant, onClose, duration }: ToastProps) => {
  const styles = variantStyles[variant];
  const Icon = styles.icon;
  const closeAfter = duration === undefined ? DEFAULT_DURATION_MS[variant] : duration;
  // Reading a toast should not be raced by its own timer.
  const [held, setHeld] = useState(false);

  // Callers pass a fresh arrow for onClose on every render, so keeping it in a
  // ref stops the timer being torn down and restarted before it can ever fire.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (closeAfter == null || closeAfter <= 0 || held) return;
    const timer = setTimeout(() => onCloseRef.current(), closeAfter);
    return () => clearTimeout(timer);
  }, [closeAfter, held, message]);

  return (
    <motion.div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
      className="fixed left-4 right-4 top-36 z-[90] flex items-start gap-3 overflow-hidden rounded-xl border border-border bg-card py-3 pl-4 pr-2 text-card-foreground shadow-lg sm:left-auto sm:w-[26rem] md:top-20"
    >
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', styles.bar)} />
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          styles.tone
        )}
      >
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 py-1 text-sm font-medium leading-5 text-foreground">
        {message}
      </span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </motion.div>
  );
};
