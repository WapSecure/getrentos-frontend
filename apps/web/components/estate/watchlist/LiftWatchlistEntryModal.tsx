'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, LegacyInput } from '@getrentos/ui';

/** The API's floor. Kept in step so the form never allows what the server will reject. */
const REASON_MIN_LENGTH = 10;

interface LiftWatchlistEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Who is being taken off the list, for the confirmation copy. */
  label: string;
  onSubmit: (reason: string) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

/**
 * Takes an entry off the watch list.
 *
 * A reason is required, and the copy says what the change actually does — from
 * the next arrival onward, nothing is refused. Lifting is not a soft delete:
 * the row stays, the audit keeps it, and the estate can still answer "was this
 * person on our list in March, and who decided that?".
 */
export const LiftWatchlistEntryModal = ({
  isOpen,
  onClose,
  label,
  onSubmit,
  isSubmitting,
  error,
}: LiftWatchlistEntryModalProps) => {
  const [reason, setReason] = useState('');

  const handleClose = () => {
    setReason('');
    onClose();
  };

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
              <h3 className="font-semibold text-foreground">Take {label} off the list</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                They will be admitted normally from the next arrival onward. The entry stays on the
                record, so the estate can still see that they were listed and who lifted it.
              </p>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Why is it being lifted?
                </label>
                <LegacyInput
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Matter resolved, matter withdrawn"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Kept with the entry. At least {REASON_MIN_LENGTH} characters.
                </p>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="ghost" fullWidth onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={reason.trim().length < REASON_MIN_LENGTH || isSubmitting}
                onClick={() => onSubmit(reason.trim())}
              >
                {isSubmitting ? 'Lifting…' : 'Take off the list'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
