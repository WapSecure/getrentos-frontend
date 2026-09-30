'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

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

const variantStyles = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-300',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-300',
    icon: XCircle,
    iconColor: 'text-red-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-300',
    icon: Info,
    iconColor: 'text-blue-500',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-300',
    icon: AlertCircle,
    iconColor: 'text-yellow-500',
  },
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
      className={`fixed left-4 right-4 top-36 z-[90] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg sm:left-auto sm:max-w-md md:top-20 ${styles.bg} ${styles.border}`}
    >
      <Icon aria-hidden="true" className={`h-5 w-5 shrink-0 ${styles.iconColor}`} />
      <span className={`min-w-0 flex-1 text-sm font-medium ${styles.text}`}>{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className={`ml-2 shrink-0 rounded-md p-1 ${styles.text} hover:opacity-70`}
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </motion.div>
  );
};
