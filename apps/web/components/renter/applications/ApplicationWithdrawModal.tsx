'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { Alert, Button, Field, IconButton, Select } from '@getrentos/ui';
import { Application } from '@/types/renter';

interface ApplicationWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  onWithdraw: (id: string, reason: string) => Promise<void>;
}

export const ApplicationWithdrawModal = ({
  isOpen,
  onClose,
  application,
  onWithdraw,
}: ApplicationWithdrawModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'confirm' | 'success' | 'error'>('confirm');
  const [reason, setReason] = useState('');

  const handleWithdraw = async () => {
    setIsLoading(true);
    setStep('confirm');

    try {
      await onWithdraw(application.id, reason);
      setStep('success');
      window.setTimeout(() => {
        onClose();
        setStep('confirm');
        setIsLoading(false);
        setReason('');
      }, 1200);
    } catch {
      setStep('error');
      window.setTimeout(() => {
        setStep('confirm');
        setIsLoading(false);
      }, 2000);
    }
  };

  const reasons = [
    'Found another property',
    'Change of plans',
    'Not interested anymore',
    'Too expensive',
    'Other',
  ];

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
                <h3 className="font-semibold text-foreground">Withdraw Application</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{application.title}</p>
              </div>
              <IconButton
                label="Close withdrawal dialog"
                icon={<X />}
                size="sm"
                onClick={onClose}
                disabled={isLoading}
              />
            </div>

            {step === 'confirm' && (
              <div className="p-4 space-y-4">
                <Alert variant="warning" title="Are you sure?">
                  This action cannot be undone. You&apos;ll need to reapply if you change your mind.
                </Alert>

                <Field label="Reason for withdrawal">
                  <Select
                    value={reason}
                    onValueChange={setReason}
                    placeholder="Select a reason..."
                    options={reasons.map((r) => ({ value: r, label: r }))}
                  />
                </Field>

                <div className="flex gap-3">
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={handleWithdraw}
                    disabled={!reason}
                    isLoading={isLoading}
                    loadingText="Withdrawing..."
                  >
                    Confirm Withdrawal
                  </Button>
                  <Button variant="ghost" fullWidth onClick={onClose} disabled={isLoading}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="p-8 text-center" role="status">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-subtle flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Application Withdrawn</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your application has been successfully withdrawn.
                </p>
              </div>
            )}

            {step === 'error' && (
              <div className="p-8 text-center" role="alert">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive-subtle flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Something Went Wrong</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Failed to withdraw application. Please try again.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
