'use client';

import { ReactNode } from 'react';
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
}

export const DialogContent = ({ children, className, showClose = true }: DialogContentProps) => (
  <RadixDialog.Portal forceMount>
    <RadixDialog.Overlay asChild forceMount>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/55"
      />
    </RadixDialog.Overlay>
    <RadixDialog.Content asChild forceMount>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className={cn(
          // p-6 is the default so a modal is never flush to the edge; a full-bleed
          // modal (image preview, section layout with full-width dividers) opts out
          // with `p-0`, and tailwind-merge lets that — or any p-* — win over this.
          'fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] w-full overflow-y-auto rounded-t-xl border border-border bg-card p-5 shadow-xl focus:outline-none sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:p-6',
          className
        )}
      >
        {children}
        {showClose && (
          <RadixDialog.Close
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </RadixDialog.Close>
        )}
      </motion.div>
    </RadixDialog.Content>
  </RadixDialog.Portal>
);

export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;
export const DialogClose = RadixDialog.Close;
