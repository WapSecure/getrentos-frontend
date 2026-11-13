'use client';

import { useState } from 'react';
import { isNoAccountMessage } from '@sureground/shared';
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@sureground/ui';
import { ContactField, contactIsReady } from '@/components/shared/contact/ContactField';
import { InviteToSignUp } from '@/components/shared/representatives/InviteToSignUp';
import type { Household } from '@/types/estate';

interface LinkResidentModalProps {
  household: Household | null;
  onClose: () => void;
  /** Their phone number or email, as typed. */
  onSubmit: (contact: string) => void;
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
  const [contact, setContact] = useState('');
  const noAccount = isNoAccountMessage(error);

  const handleClose = () => {
    setContact('');
    onClose();
  };

  return (
    <Dialog open={!!household} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size={noAccount ? 'lg' : 'md'}>
        <DialogTitle className="text-lg font-semibold text-foreground">Link resident</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          {household?.unitLabel}
        </DialogDescription>

        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (contactIsReady(contact)) onSubmit(contact.trim());
          }}
        >
          <ContactField
            id="resident-contact"
            label="The resident's phone number or email"
            hint="The one on their Sureground account. Linking gives them their own dashboard for this household."
            required
            value={contact}
            onChange={setContact}
            error={!noAccount && error ? error : undefined}
            autoFocus
          />
          {noAccount && (
            <InviteToSignUp
              message="Nobody on Sureground uses that phone number or email yet. Send them the signup link."
              reason="link you to your home in our estate"
              footnote="Once they have signed up, link them here with the same phone number or email."
            />
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!contactIsReady(contact)}
              isLoading={isSubmitting}
              loadingText="Linking…"
            >
              Link resident
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
