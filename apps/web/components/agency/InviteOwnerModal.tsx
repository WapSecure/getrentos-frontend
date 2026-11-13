'use client';

import { useState } from 'react';
import { isNoAccountMessage } from '@sureground/shared';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
} from '@sureground/ui';
import { ContactField, contactIsReady } from '@/components/shared/contact/ContactField';
import { InviteToSignUp } from '@/components/shared/representatives/InviteToSignUp';

interface InviteOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** `contact` is the owner's phone number or email, as typed. */
  onSubmit: (input: { contact: string; name?: string; note?: string }) => void;
  /** Called when the contact changes, so a stale server error can be cleared. */
  onEdit?: () => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export function InviteOwnerModal({
  isOpen,
  onClose,
  onSubmit,
  onEdit,
  isSubmitting,
  error,
}: InviteOwnerModalProps) {
  const [contact, setContact] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const noAccount = isNoAccountMessage(error);

  const reset = () => {
    setContact('');
    setName('');
    setNote('');
  };
  const handleClose = () => {
    reset();
    onClose();
  };
  const submit = () => {
    if (!contactIsReady(contact)) return;
    onSubmit({
      contact: contact.trim(),
      name: name.trim() || undefined,
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="lg" className="p-0">
        <div className="border-b border-border p-4 pr-12">
          <DialogTitle className="font-semibold text-foreground">Invite an owner</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Invite an owner to bring their property under your management.
          </DialogDescription>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="space-y-3 p-4">
            <ContactField
              id="owner-invite-contact"
              label="Owner's phone number or email"
              hint="If they are on Sureground they get the invitation in their app; an email address also gets it by email."
              required
              value={contact}
              onChange={(next) => {
                setContact(next);
                onEdit?.();
              }}
            />
            <Field label="Name" optionalLabel="(optional)">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Amaka Eze"
              />
            </Field>
            <Field label="Note" optionalLabel="(optional)">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="A short message"
              />
            </Field>
            {noAccount ? (
              <InviteToSignUp
                message="Nobody on Sureground uses that phone number yet, and we cannot text an invite. Send them the signup link, or invite them by email instead."
                reason="manage your property with you"
                footnote="Once they have signed up, invite them here with the same phone number."
              />
            ) : (
              error && <Alert variant="danger">{error}</Alert>
            )}
          </div>

          <div className="flex gap-3 border-t border-border p-4">
            <Button type="button" variant="ghost" fullWidth onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={!contactIsReady(contact)}
              isLoading={isSubmitting}
              loadingText="Sending…"
            >
              Send invite
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
