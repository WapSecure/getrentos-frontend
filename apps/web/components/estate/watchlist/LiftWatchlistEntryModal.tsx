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
  Input,
} from '@getrentos/ui';

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
 * A reason is required, and the copy says what the change actually does: from
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
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="sm">
        <DialogTitle className="text-lg font-semibold text-foreground">
          Take {label} off the list
        </DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          They will be admitted normally from the next arrival onward. The entry stays on the
          record, so the estate can still see that they were listed and who lifted it.
        </DialogDescription>

        <div className="mt-4 space-y-3">
          <Field
            label="Why is it being lifted?"
            required
            hint={`Kept with the entry. At least ${REASON_MIN_LENGTH} characters.`}
          >
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Matter resolved, matter withdrawn"
            />
          </Field>
          {error && <Alert variant="danger">{error}</Alert>}
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={reason.trim().length < REASON_MIN_LENGTH}
            isLoading={isSubmitting}
            loadingText="Lifting…"
            onClick={() => onSubmit(reason.trim())}
          >
            Take off the list
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
