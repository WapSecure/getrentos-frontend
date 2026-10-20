'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, CurrencyInput, Field, IconButton, NumberInput } from '@getrentos/ui';

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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Due settings</h3>
              <IconButton label="Close" icon={<X />} size="sm" onClick={handleClose} />
            </div>

            <div className="p-4 space-y-4">
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

            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="ghost" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                isLoading={isSubmitting}
                disabled={isBeyondGraceLimit}
                onClick={() => onSubmit({ lateFeeAmount, graceDays })}
              >
                Save
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
