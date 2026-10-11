'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button, LegacyInput } from '@getrentos/ui';

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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-sm overflow-hidden rounded-xl bg-card"
          >
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="font-semibold text-foreground">Invite an owner</h3>
              <button onClick={handleClose} className="rounded-lg p-1 hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Owner email
                </label>
                <LegacyInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@example.com"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  They’ll get an email to join GetRentos (or sign in) and accept.
                </p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Name <span className="text-muted-foreground">(optional)</span>
                </label>
                <LegacyInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Note <span className="text-muted-foreground">(optional)</span>
                </label>
                <LegacyInput
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="A short message"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <div className="flex gap-3 border-t border-border p-4">
              <Button variant="ghost" fullWidth onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={!email.trim() || isSubmitting}
                onClick={() =>
                  onSubmit({
                    email: email.trim(),
                    name: name.trim() || undefined,
                    note: note.trim() || undefined,
                  })
                }
              >
                {isSubmitting ? 'Sending…' : 'Send invite'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
