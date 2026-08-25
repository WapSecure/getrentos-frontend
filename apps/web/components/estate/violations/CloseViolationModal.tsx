'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@getrentos/ui';

interface CloseViolationModalProps {
  isOpen: boolean;
  action: 'resolve' | 'dismiss' | null;
  onClose: () => void;
  onConfirm: (resolutionNotes?: string) => void;
  isSubmitting?: boolean;
}

export const CloseViolationModal = ({
  isOpen,
  action,
  onClose,
  onConfirm,
  isSubmitting,
}: CloseViolationModalProps) => {
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleClose = () => {
    setResolutionNotes('');
    onClose();
  };

  const title = action === 'dismiss' ? 'Dismiss Violation' : 'Resolve Violation';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-foreground">{title}</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              <label className="block text-sm font-medium text-foreground mb-1">
                Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
                placeholder="How this was handled…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="ghost" fullWidth onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={isSubmitting}
                onClick={() => onConfirm(resolutionNotes.trim() || undefined)}
              >
                {isSubmitting ? 'Saving…' : title}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
