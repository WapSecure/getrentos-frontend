'use client';

import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogTitle, Field, Input } from '@getrentos/ui';

interface InviteGatemanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export const InviteGatemanModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: InviteGatemanModalProps) => {
  const [email, setEmail] = useState('');

  const handleClose = () => {
    setEmail('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="sm">
        <DialogTitle className="text-lg font-semibold text-foreground">Add Gateman</DialogTitle>

        <div className="mt-5 space-y-3">
          <Field
            label="Platform account email"
            required
            error={error || undefined}
            hint="They must already have a GetRentos account with this email."
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gateman@example.com"
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
            loadingText="Adding…"
            onClick={() => onSubmit(email.trim())}
          >
            Add Gateman
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
