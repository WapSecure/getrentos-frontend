'use client';

import { Textarea } from '@getrentos/ui';

import { LegacySelect } from '@getrentos/ui';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, FileText, Send } from 'lucide-react';
import { Button } from '@getrentos/ui';

interface PaymentDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string;
  onSubmit: (paymentId: string, reason: string, details: string) => void;
}

export const PaymentDisputeModal = ({
  isOpen,
  onClose,
  paymentId,
  onSubmit,
}: PaymentDisputeModalProps) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!reason || !details) return;
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      onSubmit(paymentId, reason, details);
      setIsSubmitting(false);
      onClose();
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
                <h3 className="font-semibold text-foreground">Dispute Payment</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Payment ID: {paymentId.slice(0, 8)}
                </p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    Please provide detailed information about your dispute. This will be reviewed by
                    our team.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Reason for Dispute
                </label>
                <LegacySelect
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a reason...</option>
                  <option value="incorrect_amount">Incorrect Amount</option>
                  <option value="duplicate_payment">Duplicate Payment</option>
                  <option value="payment_not_processed">Payment Not Processed</option>
                  <option value="unauthorized">Unauthorized Payment</option>
                  <option value="other">Other</option>
                </LegacySelect>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Details</label>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Please provide additional details about your dispute..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={!reason || !details || isSubmitting}
                  isLoading={isSubmitting}
                >
                  <Send className="w-4 h-4" />
                  Submit Dispute
                </Button>
                <Button variant="ghost" fullWidth onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
