'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
} from '@getrentos/ui';
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
    <Dialog open={!!household} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="sm">
        <DialogTitle className="text-lg font-semibold text-foreground">Link Resident</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          {household?.unitLabel}
        </DialogDescription>

        <div className="mt-5 space-y-3">
          <Field
            label="Platform account email"
            required
            error={error || undefined}
            hint="They must already have a GetRentos account with this email. Linking gives them their own dashboard for this household."
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="resident@example.com"
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!email.trim()}
            isLoading={isSubmitting}
            loadingText="Linking…"
            onClick={() => onSubmit(email.trim())}
          >
            Link Resident
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
