'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, LegacyInput } from '@getrentos/ui';
import type { Household } from '@/types/estate';

interface HouseholdModalProps {
  isOpen: boolean;
  household: Household | null;
  onClose: () => void;
  onSubmit: (data: {
    unitLabel: string;
    residentName: string;
    contactPhone?: string;
    contactEmail?: string;
  }) => void;
  isSubmitting?: boolean;
}

export const HouseholdModal = ({
  isOpen,
  household,
  onClose,
  onSubmit,
  isSubmitting,
}: HouseholdModalProps) => {
  const [unitLabel, setUnitLabel] = useState(household?.unitLabel ?? '');
  const [residentName, setResidentName] = useState(household?.residentName ?? '');
  const [contactPhone, setContactPhone] = useState(household?.contactPhone ?? '');
  const [contactEmail, setContactEmail] = useState(household?.contactEmail ?? '');

  const canSubmit = unitLabel.trim() && residentName.trim();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-foreground">
                {household ? 'Edit Household' : 'Add Household'}
              </h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Unit / Plot Label
                </label>
                <LegacyInput
                  type="text"
                  value={unitLabel}
                  onChange={(e) => setUnitLabel(e.target.value)}
                  placeholder="e.g. Block A, Plot 12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Resident Name
                </label>
                <LegacyInput
                  type="text"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phone <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <LegacyInput
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <LegacyInput
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="ghost" fullWidth onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={!canSubmit || isSubmitting}
                onClick={() =>
                  onSubmit({
                    unitLabel: unitLabel.trim(),
                    residentName: residentName.trim(),
                    contactPhone: contactPhone.trim() || undefined,
                    contactEmail: contactEmail.trim() || undefined,
                  })
                }
              >
                {isSubmitting ? 'Saving…' : household ? 'Save Changes' : 'Add Household'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
