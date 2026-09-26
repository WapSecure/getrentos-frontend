'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@getrentos/ui';
import type { MusterTally } from '@/types/estate';

/** The API's floor on a closing note, kept in step so the form cannot under-run it. */
const NOTE_MIN_LENGTH = 3;

interface CloseMusterDialogProps {
  isOpen: boolean;
  tally: MusterTally;
  onClose: () => void;
  onConfirm: (closingNote?: string) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

/**
 * Stands the roll down.
 *
 * Closing with people still unaccounted for is allowed and always will be: an
 * estate that searched and could not find somebody has to be able to stop, and a
 * system that refused would teach managers to tick names they cannot verify.
 * What is not allowed is closing that way *silently*, so the note is required
 * here exactly when the API will require it — the manager finds that out from
 * this screen rather than from a 400 at the end of an incident.
 *
 * A roll may close with somebody marked as needing help and no note at all. That
 * is not a gap: the roll exists to find people, and "found, being treated"
 * answers the question it was asked.
 */
export const CloseMusterDialog = ({
  isOpen,
  tally,
  onClose,
  onConfirm,
  isSubmitting,
  error,
}: CloseMusterDialogProps) => {
  const [note, setNote] = useState('');
  const needsNote = tally.unaccounted > 0;
  const tooShort = note.trim().length < NOTE_MIN_LENGTH;

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="bg-card rounded-xl max-w-md w-full p-5"
            role="dialog"
            aria-modal="true"
            aria-label="Stand the roll down"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">Stand the roll down?</h2>
              <button onClick={handleClose} aria-label="Close" className="text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mt-1">
              The roll is frozen and every household is told the estate has stood down. Nobody can
              be marked afterwards — the record says what the estate knew at the time, and a line
              added later is indistinguishable from a correction to a mistake nobody made.
            </p>

            {needsNote && (
              <p className="text-sm text-amber-600 mt-3">
                {tally.unaccounted === 1
                  ? 'One person on the roll has not been answered for.'
                  : `${tally.unaccounted} people on the roll have not been answered for.`}{' '}
                The estate can stand down anyway, but it has to say what happens next.
              </p>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground mb-1">
                {needsNote ? 'What happens next for the names left?' : 'Anything to record?'}{' '}
                {!needsNote && <span className="text-muted-foreground">(optional)</span>}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder={
                  needsNote
                    ? 'e.g. Blocks A-C were searched twice; the fire service has the list of unreached visitors.'
                    : 'e.g. All clear given by the fire service at 14:40.'
                }
                className="w-full rounded-lg border border-border bg-transparent p-3 text-sm"
              />
              {needsNote && (
                <p className="text-xs text-muted-foreground mt-1">
                  At least {NOTE_MIN_LENGTH} characters. This is the only place that says the estate
                  looked and did not find them.
                </p>
              )}
            </div>

            {error && <p className="text-sm text-destructive mt-2">{error}</p>}

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={handleClose}>
                Keep the roll open
              </Button>
              <Button
                variant="primary"
                disabled={isSubmitting || (needsNote && tooShort)}
                onClick={() => onConfirm(note.trim() || undefined)}
              >
                {isSubmitting ? 'Standing down…' : 'Stand the roll down'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
