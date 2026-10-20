'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
} from '@getrentos/ui';

interface InviteOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: { email: string; name?: string; note?: string }) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export function InviteOwnerModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: InviteOwnerModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  const reset = () => {
    setEmail('');
    setName('');
    setNote('');
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-sm p-0">
        <div className="border-b border-border p-4 pr-12">
          <DialogTitle className="font-semibold text-foreground">Invite an owner</DialogTitle>
          <DialogDescription className="sr-only">
            Invite an owner to bring their property under your management.
          </DialogDescription>
        </div>

        <div className="space-y-3 p-4">
          <Field
            label="Owner email"
            hint="They’ll get an email to join GetRentos (or sign in) and accept."
            required
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
            />
          </Field>
          <Field label="Name" optionalLabel="(optional)">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </Field>
          <Field label="Note" optionalLabel="(optional)">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A short message"
            />
          </Field>
          {error && <Alert variant="danger">{error}</Alert>}
        </div>

        <div className="flex gap-3 border-t border-border p-4">
          <Button variant="ghost" fullWidth onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            disabled={!email.trim()}
            isLoading={isSubmitting}
            loadingText="Sending…"
            onClick={() =>
              onSubmit({
                email: email.trim(),
                name: name.trim() || undefined,
                note: note.trim() || undefined,
              })
            }
          >
            Send invite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
