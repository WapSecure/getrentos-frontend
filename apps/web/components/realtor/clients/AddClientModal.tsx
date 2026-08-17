'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, UserPlus, Mail } from 'lucide-react';
import { Button, Field, Input } from '@getrentos/ui';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export const AddClientModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  error = null,
}: AddClientModalProps) => {
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleClose = () => {
    setEmail('');
    setLocalError(null);
    onClose();
  };

  const handleSubmit = () => {
    const value = email.trim();
    if (!value) {
      setLocalError('Enter the client’s email address.');
      return;
    }
    if (!EMAIL_PATTERN.test(value)) {
      setLocalError('Enter a valid email address, e.g. client@example.com.');
      return;
    }
    setLocalError(null);
    onSubmit(value);
  };

  const shownError = localError ?? error;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Add Client</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add an owner or landlord by their GetRentos account email
                </p>
              </div>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <Field
                label="Email"
                htmlFor="realtor-client-email"
                required
                error={shownError ?? undefined}
              >
                <Input
                  id="realtor-client-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="client@example.com"
                  leadingIcon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (localError) setLocalError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                  }}
                  disabled={isSubmitting}
                />
              </Field>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The client must already have a GetRentos account and be registered as an owner or
                landlord. They&apos;ll receive an invitation to approve the relationship.
              </p>
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 gap-1.5"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={!email.trim()}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Send Invitation
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
