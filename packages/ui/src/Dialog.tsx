'use client';

import { useRef, type ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@getrentos/shared';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => (
  <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
    <AnimatePresence>{open && children}</AnimatePresence>
  </RadixDialog.Root>
);

interface DialogContentProps {
  children: ReactNode;
  className?: string;
  showClose?: boolean;
  /** Width on larger screens; phones always get a full-width bottom sheet. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Set false for full-bleed content (image previews, sectioned layouts). */
  padded?: boolean;
  /**
   * Whether a click outside closes the dialog. By default it does until the
   * user types into it; after that a stray click cannot throw away a half-
   * filled form (Escape and the close button still work).
   */
  closeOnOutsideClick?: boolean | 'until-edited';
}

// Written out in full: Tailwind only generates classes it finds as literals.
const DIALOG_WIDTH = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
} as const;

export const DialogContent = ({
  children,
  className,
  showClose = true,
  size = 'md',
  padded = true,
  closeOnOutsideClick = 'until-edited',
}: DialogContentProps) => {
  const edited = useRef(false);
  return (
  <RadixDialog.Portal forceMount>
    <RadixDialog.Overlay asChild forceMount>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/55"
      />
    </RadixDialog.Overlay>
    <RadixDialog.Content
      asChild
      forceMount
      onInteractOutside={(event) => {
        if (closeOnOutsideClick === false || (closeOnOutsideClick === 'until-edited' && edited.current)) {
          event.preventDefault();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        onInputCapture={() => {
          edited.current = true;
        }}
        className={cn(
          // p-6 is the default so a modal is never flush to the edge; a full-bleed
          // modal (image preview, section layout with full-width dividers) opts out
          // with `p-0`, and tailwind-merge lets that — or any p-* — win over this.
          'fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] w-full overflow-y-auto rounded-t-xl border border-border bg-card shadow-xl focus:outline-none sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[calc(100%-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl',
          DIALOG_WIDTH[size],
          padded && 'p-5 sm:p-6',
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
