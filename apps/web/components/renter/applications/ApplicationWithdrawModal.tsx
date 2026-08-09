'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Application } from '@/types/renter';

interface ApplicationWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  onWithdraw: (id: string) => void;
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
      // In production, call API to withdraw application
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStep('success');
      setTimeout(() => {
        onWithdraw(application.id);
        onClose();
        setStep('confirm');
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      setStep('error');
      setTimeout(() => {
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
                <p className="text-xs text-gray-500 mt-0.5">{application.title}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-secondary transition-colors"
                disabled={isLoading}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {step === 'confirm' && (
              <div className="p-4 space-y-4">
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        Are you sure?
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                        This action cannot be undone. You&apos;ll need to reapply if you change your
                        mind.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Reason for withdrawal
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a reason...</option>
                    {reasons.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="danger"
                    fullWidth
                    onClick={handleWithdraw}
                    disabled={!reason || isLoading}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Confirm Withdrawal'
                    )}
                  </Button>
                  <Button variant="ghost" fullWidth onClick={onClose} disabled={isLoading}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Application Withdrawn</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Your application has been successfully withdrawn.
                </p>
              </div>
            )}

            {step === 'error' && (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Something Went Wrong</h3>
                <p className="text-sm text-gray-500 mt-1">
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
