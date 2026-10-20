'use client';

import { useState } from 'react';
import {
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  Input,
} from '@getrentos/ui';

interface IssueResidentVisitorPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    visitorName: string;
    visitorPhone?: string;
    purpose?: string;
    expiresAt?: string;
  }) => void;
  isSubmitting?: boolean;
}

export const IssueResidentVisitorPassModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: IssueResidentVisitorPassModalProps) => {
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleClose = () => {
    setVisitorName('');
    setVisitorPhone('');
    setPurpose('');
    setExpiresAt('');
    onClose();
  };

  const canSubmit = visitorName.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="md">
        <DialogTitle className="text-lg font-semibold text-foreground">
          Issue Visitor Pass
        </DialogTitle>

        <div className="mt-5 space-y-4">
          <Field label="Visitor Name" required>
            <Input
              type="text"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="e.g. Tunde Adekunle"
            />
          </Field>

          <Field label="Phone" optionalLabel="(optional)">
            <Input
              type="tel"
              autoComplete="tel"
              value={visitorPhone}
              onChange={(e) => setVisitorPhone(e.target.value)}
              placeholder="e.g. 08012345678"
            />
          </Field>

          <Field label="Purpose" optionalLabel="(optional)">
            <Input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Family visit"
            />
          </Field>

          <Field label="Expires" optionalLabel="(optional: defaults to 24 hours)">
            <DatePicker value={expiresAt} onChange={setExpiresAt} clearable />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            isLoading={isSubmitting}
            loadingText="Issuing…"
            onClick={() =>
              onSubmit({
                visitorName: visitorName.trim(),
                visitorPhone: visitorPhone.trim() || undefined,
                purpose: purpose.trim() || undefined,
                expiresAt: expiresAt || undefined,
              })
            }
          >
            Issue Pass
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
