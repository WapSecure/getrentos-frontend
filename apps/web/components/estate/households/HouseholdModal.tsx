'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, Field, IconButton, Input } from '@getrentos/ui';
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
              <IconButton label="Close" icon={<X />} size="sm" onClick={onClose} />
            </div>

            <div className="p-4 space-y-4">
              <Field label="Unit / Plot Label">
                <Input
                  type="text"
                  value={unitLabel}
                  onChange={(e) => setUnitLabel(e.target.value)}
                  placeholder="e.g. Block A, Plot 12"
                />
              </Field>

              <Field label="Resident Name">
                <Input
                  type="text"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                />
              </Field>

              <Field label="Phone" optionalLabel="(optional)">
                <Input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </Field>

              <Field label="Email" optionalLabel="(optional)">
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </Field>
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="ghost" fullWidth onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={!canSubmit}
                isLoading={isSubmitting}
                loadingText="Saving…"
                onClick={() =>
                  onSubmit({
                    unitLabel: unitLabel.trim(),
                    residentName: residentName.trim(),
                    contactPhone: contactPhone.trim() || undefined,
                    contactEmail: contactEmail.trim() || undefined,
                  })
                }
              >
                {household ? 'Save Changes' : 'Add Household'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
