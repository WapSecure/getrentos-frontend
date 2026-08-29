'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, LegacyInput } from '@getrentos/ui';
import type { Household } from '@/types/estate';

interface LinkResidentModalProps {
  household: Household | null;
  onClose: () => void;
  onSubmit: (email: string) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export const LinkResidentModal = ({
  household,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: LinkResidentModalProps) => {
  const [email, setEmail] = useState('');

  const handleClose = () => {
    setEmail('');
    onClose();
  };

  return (
    <AnimatePresence>
      {household && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Link Resident</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{household.unitLabel}</p>
              </div>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Platform account email
                </label>
                <LegacyInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="resident@example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  They must already have a GetRentos account with this email. Linking gives them
                  their own dashboard for this household.
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
                disabled={!email.trim() || isSubmitting}
                onClick={() => onSubmit(email.trim())}
              >
                {isSubmitting ? 'Linking…' : 'Link Resident'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
