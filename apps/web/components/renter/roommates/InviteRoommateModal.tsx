'use client';

import { useState } from 'react';
import { Send } from '@sureground/icons';
import { isNoAccountMessage, readContactInput } from '@sureground/shared';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Textarea,
} from '@sureground/ui';
import { ContactField, contactIsReady } from '@/components/shared/contact/ContactField';
import { InviteToSignUp } from '@/components/shared/representatives/InviteToSignUp';

interface InviteRoommateModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** `contact` is their phone number or email, as typed. Rejects with the server's message. */
  onInvite: (data: { contact: string; message: string }) => Promise<void>;
}

export const InviteRoommateModal = ({ isOpen, onClose, onInvite }: InviteRoommateModalProps) => {
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAccount, setNoAccount] = useState(false);
  const isPhone = readContactInput(contact).kind === 'phone';

  const reset = () => {
    setContact('');
    setMessage('');
    setError(null);
    setNoAccount(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!contactIsReady(contact)) return;
    setIsSubmitting(true);
    setError(null);
    setNoAccount(false);
    try {
      await onInvite({ contact: contact.trim(), message: message.trim() });
      setIsSubmitting(false);
      handleClose();
    } catch (reason) {
      const text = reason instanceof Error ? reason.message : '';
      if (isNoAccountMessage(text)) setNoAccount(true);
      else setError(text || 'We could not send the invitation. Check the details and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="lg">
        <DialogTitle className="pr-8 font-semibold text-foreground">Invite roommate</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          Send an invitation to join your household
        </DialogDescription>

        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <ContactField
            id="roommate-contact"
            label="Their phone number or email"
            hint="If they are already on Sureground, use the one on their account."
            required
            value={contact}
            onChange={(next) => {
              setContact(next);
              setNoAccount(false);
            }}
          />

          <Field label="Personal message" optionalLabel="(Optional)">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I'd like to invite you to join my household on Sureground..."
              rows={4}
            />
          </Field>

          {error && <Alert variant="danger">{error}</Alert>}

          {noAccount ? (
            <InviteToSignUp
              message="Nobody on Sureground uses that phone number yet, and we cannot text an invite. Send them the signup link instead."
              reason="share rent and household costs with you"
              footnote="Once they have signed up, invite them here with the same phone number."
            />
          ) : (
            <Alert variant="info">
              {isPhone
                ? 'If they are on Sureground, they get the invitation in their app. If not, we will help you share a signup link.'
                : 'If they are on Sureground, they get the invitation in their app. If not, we email them an invitation to sign up.'}
            </Alert>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={!contactIsReady(contact)}
            isLoading={isSubmitting}
            icon={<Send className="w-4 h-4" />}
          >
            Send invitation
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
