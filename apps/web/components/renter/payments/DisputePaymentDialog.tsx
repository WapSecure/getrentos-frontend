'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Textarea,
} from '@getrentos/ui';

interface DisputePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => Promise<void>;
}

const MIN_REASON = 10;
const MAX_REASON = 1000;

export const DisputePaymentDialog = ({
  open,
  onOpenChange,
  onSubmit,
}: DisputePaymentDialogProps) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = (next: boolean) => {
    if (isSubmitting) return;
    if (!next) {
      setReason('');
      setAttempted(false);
    }
    onOpenChange(next);
  };

  const trimmed = reason.trim();
  const tooShort = trimmed.length < MIN_REASON;
  const [attempted, setAttempted] = useState(false);
  const reasonError =
    attempted && tooShort ? `Say what is wrong in at least ${MIN_REASON} characters.` : undefined;

  const handleSubmit = async () => {
    setAttempted(true);
    if (tooShort || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(reason.trim());
      setReason('');
      onOpenChange(false);
    } catch {
      // The parent displays the server error; keep the reason available for retry.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 sm:p-0">
        <div className="p-4 pr-12 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">Dispute Payment</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Tell us what&apos;s wrong with this charge: our support team will review it within 2
            business days.
          </DialogDescription>
        </div>

        <div className="p-4 space-y-3">
          <Field
            label="Reason for dispute"
            required
            error={reasonError}
            hint={`${trimmed.length}/${MAX_REASON} characters`}
          >
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={MAX_REASON}
              rows={4}
              placeholder="e.g. I was charged twice for the same month's rent"
            />
          </Field>

          <Button
            variant="primary"
            fullWidth
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            Submit Dispute
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
