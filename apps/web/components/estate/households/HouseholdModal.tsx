'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogTitle, Field, Input } from '@getrentos/ui';
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
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="md">
        <DialogTitle className="text-lg font-semibold text-foreground">
          {household ? 'Edit Household' : 'Add Household'}
        </DialogTitle>

        <div className="mt-5 space-y-4">
          <Field label="Unit / Plot Label" required>
            <Input
              type="text"
              value={unitLabel}
              onChange={(e) => setUnitLabel(e.target.value)}
              placeholder="e.g. Block A, Plot 12"
            />
          </Field>

          <Field label="Resident Name" required>
            <Input
              type="text"
              value={residentName}
              onChange={(e) => setResidentName(e.target.value)}
            />
          </Field>

          <Field label="Phone" optionalLabel="(optional)">
            <Input
              type="tel"
              autoComplete="tel"
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

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
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
      </DialogContent>
    </Dialog>
  );
};
