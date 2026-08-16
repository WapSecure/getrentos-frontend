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
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />
    </RadixDialog.Overlay>
    <RadixDialog.Content asChild forceMount>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-card shadow-[0_24px_80px_rgba(0,0,0,0.28)] focus:outline-none',
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
