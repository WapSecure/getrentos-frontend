'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Textarea,
} from '@sureground/ui';
import type { MusterTally } from '@/types/estate';

// The API's minimum note length; keep in step.
const NOTE_MIN_LENGTH = 3;

interface CloseMusterDialogProps {
  isOpen: boolean;
  tally: MusterTally;
  onClose: () => void;
  onConfirm: (closingNote?: string) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

// Closing with people unaccounted for is allowed, but the note is then required, exactly as the API requires it.
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
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="md">
        <DialogTitle className="pr-8 text-lg font-semibold text-foreground">
          Stand the roll down?
        </DialogTitle>

        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          The roll is frozen and every household is told the estate has stood down. Nobody can be
          marked afterwards: the record says what the estate knew at the time, and a line added
          later is indistinguishable from a correction to a mistake nobody made.
        </DialogDescription>

        {needsNote && (
          <Alert variant="warning" className="mt-3">
            {tally.unaccounted === 1
              ? 'One person on the roll has not been answered for.'
              : `${tally.unaccounted} people on the roll have not been answered for.`}{' '}
            The estate can stand down anyway, but it has to say what happens next.
          </Alert>
        )}

        <Field
          className="mt-4"
          label={needsNote ? 'What happens next for the names left?' : 'Anything to record?'}
          required={needsNote}
          optionalLabel="(optional)"
          hint={
            needsNote
              ? `At least ${NOTE_MIN_LENGTH} characters. This is the only place that says the estate looked and did not find them.`
              : undefined
          }
        >
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder={
              needsNote
                ? 'e.g. Blocks A-C were searched twice; the fire service has the list of unreached visitors.'
                : 'e.g. All clear given by the fire service at 14:40.'
            }
            showCount
          />
        </Field>

        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Keep the roll open
          </Button>
          <Button
            variant="primary"
            disabled={needsNote && tooShort}
            isLoading={isSubmitting}
            loadingText="Standing down…"
            onClick={() => onConfirm(note.trim() || undefined)}
          >
            Stand the roll down
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
