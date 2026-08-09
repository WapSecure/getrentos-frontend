'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import type { RentPayment, EscrowStatus } from '@/types/landlord';

interface PaymentDetailsModalProps {
  payment: RentPayment | null;
  onClose: () => void;
}

const escrowSteps: { key: EscrowStatus; label: string }[] = [
  { key: 'held', label: 'Funds Held' },
  { key: 'pending_review', label: 'Verification' },
  { key: 'released', label: 'Released' },
];

const stepOrder: EscrowStatus[] = ['held', 'pending_review', 'released'];

export const PaymentDetailsModal = ({ payment, onClose }: PaymentDetailsModalProps) => {
  if (!payment) return null;

  const currentIndex =
    payment.escrowStatus === 'frozen' ? -1 : stepOrder.indexOf(payment.escrowStatus);

  return (
    <AnimatePresence>
      {payment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-md w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-foreground">Payment Details</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {payment.tenantName} — {payment.unitName}
                </p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              <div className="text-center py-3">
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(payment.amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Due {formatDate(payment.dueDate)}
                  {payment.paidDate ? ` • Paid ${formatDate(payment.paidDate)}` : ''}
                </p>
              </div>

              {payment.escrowStatus === 'frozen' ? (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      Funds Frozen — Dispute Raised
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                      {payment.disputeReason ||
                        'A dispute has been raised on this payment. Funds are frozen until the dispute is resolved by GetRentos support.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    {escrowSteps.map((step, index) => {
                      const isComplete = index <= currentIndex;
                      return (
                        <div key={step.key} className="flex-1 flex flex-col items-center relative">
                          {index > 0 && (
                            <div
                              className={`absolute right-1/2 top-2.5 w-full h-0.5 ${
                                index <= currentIndex
                                  ? 'bg-primary'
                                  : 'bg-gray-200 dark:bg-white/10'
                              }`}
                            />
                          )}
                          <div
                            className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center ${
                              isComplete ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'
                            }`}
                          >
                            {isComplete && (
                              <ShieldCheck className="w-3 h-3 text-primary-foreground" />
                            )}
                          </div>
                          <p
                            className={`text-xs mt-2 text-center ${isComplete ? 'text-foreground font-medium' : 'text-gray-400'}`}
                          >
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                <p className="text-xs text-muted-foreground">
                  Funds are held in escrow by GetRentos and released automatically once lease
                  conditions are verified. Landlords cannot manually release or bypass escrow.
                </p>
              </div>

              {payment.releaseDate && (
                <p className="text-xs text-gray-400 text-center">
                  Released to your account on {formatDate(payment.releaseDate)}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
