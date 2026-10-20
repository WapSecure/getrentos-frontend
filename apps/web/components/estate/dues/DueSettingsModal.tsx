'use client';

import { useState } from 'react';
import {
  Button,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  NumberInput,
} from '@getrentos/ui';

/** Mirrors MAX_GRACE_DAYS on the API, which rejects anything larger. */
const MAX_GRACE_DAYS = 90;

interface DueSettingsModalProps {
  isOpen: boolean;
  currentLateFeeAmount: number;
  /** The estate's current grace window, in days. */
  currentGraceDays: number;
  onClose: () => void;
  onSubmit: (data: { lateFeeAmount: number; graceDays: number }) => void;
  isSubmitting?: boolean;
}

export const DueSettingsModal = ({
  isOpen,
  currentLateFeeAmount,
  currentGraceDays,
  onClose,
  onSubmit,
  isSubmitting,
}: DueSettingsModalProps) => {
  const [lateFeeAmount, setLateFeeAmount] = useState(currentLateFeeAmount);
  const [graceDays, setGraceDays] = useState(currentGraceDays);

  const handleClose = () => {
    setLateFeeAmount(currentLateFeeAmount);
    setGraceDays(currentGraceDays);
    onClose();
  };

  const isBeyondGraceLimit = graceDays > MAX_GRACE_DAYS;

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="sm">
        <DialogTitle className="text-lg font-semibold text-foreground">Due settings</DialogTitle>

        <div className="mt-4 space-y-4">
          <Field
            label="Flat late fee"
            hint="Added once to a due the moment it becomes overdue. Set to ₦0 to disable late fees."
          >
            <CurrencyInput
              prefix="₦"
              min={0}
              value={String(lateFeeAmount)}
              onValueChange={(v) => setLateFeeAmount(v)}
              placeholder="e.g. 1000"
            />
          </Field>

          <Field
            label="Grace period (days)"
            htmlFor="graceDays"
            hint={
              graceDays === 0
                ? 'A due is flagged the moment its date passes: no grace at all.'
                : `A due may run ${graceDays} day${graceDays === 1 ? '' : 's'} past its date before it is flagged overdue and the late fee applies.`
            }
            error={
              isBeyondGraceLimit
                ? `${MAX_GRACE_DAYS} days is the maximum: beyond that a due would never be flagged.`
                : undefined
            }
          >
            <NumberInput
              min={0}
              max={MAX_GRACE_DAYS}
              value={graceDays}
              // NumberInput hands back the digit string; keep the state numeric
              // so the payload satisfies the API's integer validation.
              onValueChange={(v) => setGraceDays(Number(v) || 0)}
              placeholder="e.g. 5"
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            isLoading={isSubmitting}
            disabled={isBeyondGraceLimit}
            onClick={() => onSubmit({ lateFeeAmount, graceDays })}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
