'use client';

import { ShieldCheck } from 'lucide-react';
import { Alert, Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
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
    <Dialog open={!!payment} onOpenChange={(next) => !next && onClose()}>
      <DialogContent padded={false}>
        <div className="p-4 pr-12 border-b border-border flex justify-between items-center gap-3">
          <div className="min-w-0">
            <DialogTitle className="font-semibold text-foreground">Payment Details</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {payment.tenantName}: {payment.unitName}
            </DialogDescription>
          </div>
        </div>

        <div className="p-4 space-y-5">
          <div className="text-center py-3">
            <p className="text-3xl font-bold text-foreground">{formatCurrency(payment.amount)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Due {formatDate(payment.dueDate)}
              {payment.paidDate ? ` • Paid ${formatDate(payment.paidDate)}` : ''}
            </p>
            {payment.status !== 'paid' && (payment.amountPaid ?? 0) > 0 && (
              <p className="text-xs text-success mt-1">
                {formatCurrency(payment.amountPaid ?? 0)} received ·{' '}
                {formatCurrency(payment.amount - (payment.amountPaid ?? 0))} still owed. It is paid
                out once the charge is paid in full.
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
                        {isComplete && <ShieldCheck className="w-3 h-3 text-primary-foreground" />}
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
            GetRentos holds the tenant’s rent and releases it to you on its scheduled release date,
            or sooner once the tenant confirms move-in. A dispute keeps it held until it is
            resolved. Landlords cannot pay it out early or skip this step.
          </Alert>

          {payment.releaseDate && (
            <p className="text-xs text-muted-foreground text-center">
              Released to your account on {formatDate(payment.releaseDate)}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
