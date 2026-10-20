'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, Field, IconButton, Input } from '@getrentos/ui';

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
              <h3 className="font-semibold text-foreground">Add Gateman</h3>
              <IconButton label="Close" icon={<X />} size="sm" onClick={handleClose} />
            </div>

            <div className="p-4 space-y-3">
              <Field
                label="Platform account email"
                hint="They must already have a GetRentos account with this email."
              >
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gateman@example.com"
                />
              </Field>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="ghost" fullWidth onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={!email.trim()}
                isLoading={isSubmitting}
                loadingText="Adding…"
                onClick={() => onSubmit(email.trim())}
              >
                Add Gateman
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
