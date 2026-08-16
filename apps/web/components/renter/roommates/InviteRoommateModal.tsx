'use client';

import { LegacyInput } from '@getrentos/ui';

import { Textarea } from '@getrentos/ui';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, UserPlus } from 'lucide-react';
import { Button } from '@getrentos/ui';

interface InviteRoommateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: { email: string; message: string }) => void;
}

export const InviteRoommateModal = ({ isOpen, onClose, onInvite }: InviteRoommateModalProps) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!email.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onInvite({ email, message });
      setIsSubmitting(false);
      onClose();
      setEmail('');
      setMessage('');
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full mx-4 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Invite Roommate</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send an invitation to join your household
                </p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <LegacyInput
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="roommate@example.com"
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => {
                      // In production, this would import from contacts
                      console.log('Import from contacts');
                    }}
                  >
                    <UserPlus className="w-3 h-3" />
                    Contacts
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Personal Message (Optional)
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi! I'd like to invite you to join my household on GetRentos..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 Your roommate will receive an email invitation to join your household.
                  They&apos;ll need to create an account if they don&apos;t have one.
                </p>
              </div>

              <Button
                variant="primary"
                fullWidth
                onClick={handleSubmit}
                disabled={!email.trim() || isSubmitting}
                isLoading={isSubmitting}
              >
                <Send className="w-4 h-4" />
                Send Invitation
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
