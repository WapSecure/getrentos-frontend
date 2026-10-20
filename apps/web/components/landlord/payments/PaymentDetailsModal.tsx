'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';
import { Alert, IconButton } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type { RentPayment, EscrowStatus } from '@/types/landlord';
import { InvoiceLines } from '@/components/shared/InvoiceLines';

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
            <div className="p-4 border-b border-border flex justify-between items-center gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">Payment Details</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {payment.tenantName}: {payment.unitName}
                </p>
              </div>
              <IconButton label="Close" size="sm" icon={<X />} onClick={onClose} />
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
                {payment.status !== 'paid' && (payment.amountPaid ?? 0) > 0 && (
                  <p className="text-xs text-success mt-1">
                    {formatCurrency(payment.amountPaid ?? 0)} received ·{' '}
                    {formatCurrency(payment.amount - (payment.amountPaid ?? 0))} still owed. It is
                    paid out once the charge is paid in full.
                  </p>
                )}
              </div>

              <InvoiceLines
                lines={payment.lines}
                periodStart={payment.periodStart}
                periodEnd={payment.periodEnd}
              />

              {payment.escrowStatus === 'frozen' ? (
                <Alert variant="danger" title="Funds Frozen: Dispute Raised">
                  {payment.disputeReason ||
                    'A dispute has been raised on this payment. Funds are frozen until the dispute is resolved by GetRentos support.'}
                </Alert>
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
                                index <= currentIndex ? 'bg-primary' : 'bg-border'
                              }`}
                            />
                          )}
                          <div
                            className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center ${
                              isComplete ? 'bg-primary' : 'bg-border'
                            }`}
                          >
                            {isComplete && (
                              <ShieldCheck className="w-3 h-3 text-primary-foreground" />
                            )}
                          </div>
                          <p
                            className={`text-xs mt-2 text-center ${isComplete ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                          >
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Alert variant="neutral">
                GetRentos holds the tenant’s payment and pays it to you automatically once the lease
                conditions are verified. Landlords cannot pay it out early or skip this step.
              </Alert>

              {payment.releaseDate && (
                <p className="text-xs text-muted-foreground text-center">
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
