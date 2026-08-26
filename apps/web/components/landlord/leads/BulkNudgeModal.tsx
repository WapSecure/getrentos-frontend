'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Button, Textarea } from '@getrentos/ui';

interface BulkNudgeModalProps {
  leadCount: number;
  onClose: () => void;
  onSend: (message: string) => void;
  isSubmitting?: boolean;
  isError?: boolean;
}

const DEFAULT_MESSAGE =
  "Hi, just following up on your interest — still looking? Let us know if you'd like to move forward.";

export const BulkNudgeModal = ({
  leadCount,
  onClose,
  onSend,
  isSubmitting,
  isError,
}: BulkNudgeModalProps) => {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  if (leadCount === 0) return null;

  const handleClose = () => {
    setMessage(DEFAULT_MESSAGE);
    onClose();
  };

  return (
    <AnimatePresence>
      {leadCount > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">
                  Nudge {leadCount} lead{leadCount === 1 ? '' : 's'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sends the same follow-up message to each selected lead.
                </p>
              </div>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Write a follow-up message..."
              />
              {isError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Something went wrong sending these nudges. Please try again.
                </p>
              )}
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="ghost" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 gap-2"
                onClick={() => onSend(message)}
                disabled={!message.trim() || isSubmitting}
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Sending…' : `Nudge ${leadCount}`}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
