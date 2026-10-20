'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, Field, IconButton, Textarea } from '@getrentos/ui';

interface CloseMaintenanceTicketModalProps {
  isOpen: boolean;
  action: 'resolve' | 'dismiss' | null;
  onClose: () => void;
  onConfirm: (resolutionNotes?: string) => void;
  isSubmitting?: boolean;
}

export const CloseMaintenanceTicketModal = ({
  isOpen,
  action,
  onClose,
  onConfirm,
  isSubmitting,
}: CloseMaintenanceTicketModalProps) => {
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleClose = () => {
    if (isSubmitting) return;
    setResolutionNotes('');
    onClose();
  };

  const title = action === 'dismiss' ? 'Dismiss Ticket' : 'Resolve Ticket';

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
              <IconButton
                label="Close"
                icon={<X />}
                size="sm"
                onClick={handleClose}
                disabled={isSubmitting}
              />
            </div>

            <div className="p-4">
              <Field label="Notes" optionalLabel="(optional)">
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  placeholder="How this was handled…"
                />
              </Field>
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="ghost" fullWidth onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                isLoading={isSubmitting}
                loadingText="Saving…"
                onClick={() => onConfirm(resolutionNotes.trim() || undefined)}
              >
                {title}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
