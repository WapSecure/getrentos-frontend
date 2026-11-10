'use client';

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from '@sureground/icons';
import { cn } from '@sureground/shared';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const ReturnFocusContext = createContext<MutableRefObject<HTMLElement | null> | null>(null);

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  // Opened from state, not a Radix trigger, so Radix would drop focus on <body> when it closes.
  const returnTo = useRef<HTMLElement | null>(null);
  useIsomorphicLayoutEffect(() => {
    if (open) {
      const active = document.activeElement;
      returnTo.current = active instanceof HTMLElement && active !== document.body ? active : null;
    }
  }, [open]);

  return (
    <ReturnFocusContext.Provider value={returnTo}>
      <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
        <AnimatePresence>{open && children}</AnimatePresence>
      </RadixDialog.Root>
    </ReturnFocusContext.Provider>
  );
};

interface DialogContentProps {
  children: ReactNode;
  className?: string;
  showClose?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padded?: boolean;
  /** By default only until the user types, so a stray click can't throw away a half-filled form. */
  closeOnOutsideClick?: boolean | 'until-edited';
}

// Written out in full: Tailwind only generates classes it finds as literals.
const DIALOG_WIDTH = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  full: '',
} as const;

const FULLSCREEN =
  'fixed inset-0 z-50 flex h-dvh w-full flex-col overflow-hidden bg-black text-white focus:outline-none';

export const DialogContent = ({
  children,
  className,
  showClose = true,
  size = 'md',
  padded = true,
  closeOnOutsideClick = 'until-edited',
}: DialogContentProps) => {
  const edited = useRef(false);
  const reduceMotion = useReducedMotion();
  const returnTo = useContext(ReturnFocusContext);
  // Otherwise the size default would win on sm+ screens because it carries the `sm:` prefix.
  const ownWidth = /(^|\s)max-w-/.test(className ?? '');
  const full = size === 'full';
  return (
    <RadixDialog.Portal forceMount>
      <RadixDialog.Overlay asChild forceMount>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-[var(--scrim)]"
        />
      </RadixDialog.Overlay>
      <RadixDialog.Content
        asChild
        forceMount
        onCloseAutoFocus={(event) => {
          const target = returnTo?.current;
          if (target && target.isConnected) {
            event.preventDefault();
            target.focus({ preventScroll: true });
          }
        }}
        onInteractOutside={(event) => {
          if (
            closeOnOutsideClick === false ||
            (closeOnOutsideClick === 'until-edited' && edited.current)
          ) {
            event.preventDefault();
          }
        }}
      >
        <motion.div
          initial={{
            opacity: 0,
            scale: reduceMotion || full ? 1 : 0.98,
            y: reduceMotion || full ? 0 : 8,
          }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{
            opacity: 0,
            scale: reduceMotion || full ? 1 : 0.98,
            y: reduceMotion || full ? 0 : 8,
          }}
          onInputCapture={() => {
            edited.current = true;
          }}
          className={cn(
            full
              ? FULLSCREEN
              : 'fixed bottom-0 left-0 right-0 z-50 max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card shadow-xl focus:outline-none sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl',
            !full && !ownWidth && DIALOG_WIDTH[size],
            !full && padded && 'px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-7',
            className
          )}
        >
          {children}
          {showClose && (
            <RadixDialog.Close
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </RadixDialog.Close>
          )}
        </motion.div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
};

export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;
export const DialogClose = RadixDialog.Close;
