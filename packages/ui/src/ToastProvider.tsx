'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast, type ToastVariant } from './Toast';

export interface ToastOptions {
  /** Null keeps it until dismissed. */
  duration?: number | null;
  action?: { label: string; onClick: () => void };
}

interface ToastItem extends ToastOptions {
  id: number;
  message: string;
  variant: ToastVariant;
}

export interface ToastApi {
  show: (message: string, variant?: ToastVariant, options?: ToastOptions) => number;
  success: (message: string, options?: ToastOptions) => number;
  error: (message: string, options?: ToastOptions) => number;
  info: (message: string, options?: ToastOptions) => number;
  warning: (message: string, options?: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = 'info', options: ToastOptions = {}) => {
      const id = nextId.current++;
      setItems((current) => {
        const withoutRepeat = current.filter(
          (item) => !(item.message === message && item.variant === variant)
        );
        return [...withoutRepeat, { id, message, variant, ...options }].slice(-MAX_VISIBLE);
      });
      return id;
    },
    []
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      success: (message, options) => show(message, 'success', options),
      error: (message, options) => show(message, 'error', options),
      info: (message, options) => show(message, 'info', options),
      warning: (message, options) => show(message, 'warning', options),
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-36 z-[90] md:top-20 flex flex-col items-stretch gap-2 sm:left-auto sm:right-4 sm:w-[26rem]">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <Toast
              key={item.id}
              placement="stack"
              message={item.message}
              variant={item.variant}
              duration={item.duration}
              action={item.action}
              onClose={() => dismiss(item.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// Must be under ToastProvider (QueryProvider includes one).
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api)
    throw new Error('useToast must be used inside <ToastProvider> (QueryProvider provides one)');
  return api;
}
