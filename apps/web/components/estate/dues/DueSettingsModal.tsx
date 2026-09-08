'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, CurrencyInput } from '@getrentos/ui';

interface DueSettingsModalProps {
  isOpen: boolean;
  currentLateFeeAmount: number;
  onClose: () => void;
  onSubmit: (data: { lateFeeAmount: number }) => void;
  isSubmitting?: boolean;
}

export const DueSettingsModal = ({
  isOpen,
  currentLateFeeAmount,
  onClose,
  onSubmit,
  isSubmitting,
}: DueSettingsModalProps) => {
  const [lateFeeAmount, setLateFeeAmount] = useState(currentLateFeeAmount);

  const handleClose = () => {
    setLateFeeAmount(currentLateFeeAmount);
    onClose();
  };

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
              <h3 className="font-semibold text-foreground">Late fee settings</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <label className="block text-sm font-medium text-foreground mb-1">
                Flat late fee (₦)
              </label>
              <CurrencyInput
                prefix="₦"
                min={0}
                value={String(lateFeeAmount)}
                onValueChange={(v) => setLateFeeAmount(v)}
                placeholder="e.g. 1000"
              />
              <p className="text-xs text-muted-foreground">
                Added once to a due the moment it becomes overdue. Set to ₦0 to disable late fees.
              </p>
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="ghost" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                isLoading={isSubmitting}
                onClick={() => onSubmit({ lateFeeAmount })}
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
