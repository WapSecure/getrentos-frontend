'use client';

import { useRef, useState } from 'react';
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
  /** The server's reason the last save failed, shown in the dialog. */
  errorMessage?: string | null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Digits with the usual separators; at least seven digits, e.g. 0801 234 5678 or +234 801 234 5678.
const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;

export const HouseholdModal = ({
  isOpen,
  household,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: HouseholdModalProps) => {
  const [unitLabel, setUnitLabel] = useState(household?.unitLabel ?? '');
  const [residentName, setResidentName] = useState(household?.residentName ?? '');
  const [contactPhone, setContactPhone] = useState(household?.contactPhone ?? '');
  const [contactEmail, setContactEmail] = useState(household?.contactEmail ?? '');

  const [attempted, setAttempted] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const canSubmit = unitLabel.trim() && residentName.trim();
  const phoneError =
    contactPhone.trim() &&
    (!PHONE_PATTERN.test(contactPhone.trim()) || contactPhone.replace(/\D/g, '').length < 7)
      ? 'Enter a valid phone number, e.g. 0801 234 5678'
      : undefined;
  const emailError =
    contactEmail.trim() && !EMAIL_PATTERN.test(contactEmail.trim())
      ? 'Enter a valid email address'
      : undefined;

  const handleSave = () => {
    setAttempted(true);
    if (phoneError) return phoneRef.current?.focus();
    if (emailError) return emailRef.current?.focus();
    onSubmit({
      unitLabel: unitLabel.trim(),
      residentName: residentName.trim(),
      contactPhone: contactPhone.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
    });
  };

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

          <Field
            label="Phone"
            optionalLabel="(optional)"
            error={attempted ? phoneError : undefined}
          >
            <Input
              ref={phoneRef}
              type="tel"
              autoComplete="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </Field>

          <Field
            label="Email"
            optionalLabel="(optional)"
            error={attempted ? emailError : undefined}
          >
            <Input
              ref={emailRef}
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </Field>
        </div>

        {errorMessage && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            isLoading={isSubmitting}
            loadingText="Saving…"
            onClick={handleSave}
          >
            {household ? 'Save Changes' : 'Add Household'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
