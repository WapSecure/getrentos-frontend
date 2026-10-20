'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Textarea,
} from '@getrentos/ui';

interface InviteRoommateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: { email: string; message: string }) => Promise<void>;
}

export const InviteRoommateModal = ({ isOpen, onClose, onInvite }: InviteRoommateModalProps) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onInvite({ email: email.trim(), message: message.trim() });
      setIsSubmitting(false);
      onClose();
      setEmail('');
      setMessage('');
    } catch {
      setError('We could not send the invitation. Check the email and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle className="pr-8 font-semibold text-foreground">Invite Roommate</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
          Send an invitation to join your household
        </DialogDescription>

        <div className="mt-4 space-y-4">
          <Field label="Email Address" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="roommate@example.com"
            />
          </Field>

          <Field label="Personal Message" optionalLabel="(Optional)">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I'd like to invite you to join my household on GetRentos..."
              rows={4}
            />
          </Field>

          {error && <Alert variant="danger">{error}</Alert>}

          <Alert variant="info">
            Your roommate will receive an email invitation to join your household. They&apos;ll need
            to create an account if they don&apos;t have one.
          </Alert>

          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={!email.trim()}
            isLoading={isSubmitting}
            icon={<Send className="w-4 h-4" />}
          >
            Send Invitation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
