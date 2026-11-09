'use client';

import { ShieldCheck } from '@sureground/icons';
import {
  Alert,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@sureground/ui';
import { rentPayoutStatusBadges } from '@/lib/statusBadge';
import { formatCurrency, formatDate } from '@/lib/format';
import type { RentPayment, EscrowStatus, RentPayoutStatus } from '@/types/landlord';
import { InvoiceLines } from '@/components/shared/InvoiceLines';

interface PaymentDetailsModalProps {
  payment: RentPayment | null;
  onClose: () => void;
}

const escrowSteps: { key: EscrowStatus; label: string }[] = [
  { key: 'held', label: 'Funds held' },
  { key: 'pending_review', label: 'Verification' },
  { key: 'released', label: 'Released from escrow' },
];

const stepOrder: EscrowStatus[] = ['held', 'pending_review', 'released'];

const payoutNote: Record<RentPayoutStatus, string> = {
  QUEUED: 'This rent is on an owner statement and waits to be sent to your bank.',
  SENT: 'The transfer is with the bank. It usually lands within a working day.',
  PAID: 'This rent has been paid to your bank account.',
  FAILED:
    'The transfer did not go through. Check your payout account details; Sureground support can help send it again.',
};

export const PaymentDetailsModal = ({ payment, onClose }: PaymentDetailsModalProps) => {
  if (!payment) return null;

  const currentIndex =
    payment.escrowStatus === 'frozen' ? -1 : stepOrder.indexOf(payment.escrowStatus);

  return (
    <Dialog open={!!payment} onOpenChange={(next) => !next && onClose()}>
      <DialogContent padded={false}>
        <div className="p-4 pr-12 border-b border-border flex justify-between items-center gap-3">
          <div className="min-w-0">
            <DialogTitle className="font-semibold text-foreground">Payment details</DialogTitle>
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
            <Alert variant="danger" title="Funds frozen: dispute raised">
              {payment.disputeReason ||
                'A dispute has been raised on this payment. Funds are frozen until the dispute is resolved by Sureground support.'}
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
            Sureground holds the tenant’s rent and releases it to you on its scheduled release date,
            or sooner once the tenant confirms move-in. A dispute keeps it held until it is
            resolved. Landlords cannot pay it out early or skip this step.
          </Alert>

          {/* Leaving escrow on releaseDate is not the bank transfer, which follows separately. */}
          {payment.escrowStatus === 'released' && payment.payoutStatus ? (
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Badge variant={rentPayoutStatusBadges[payment.payoutStatus].variant}>
                {rentPayoutStatusBadges[payment.payoutStatus].label}
              </Badge>
              <p className="text-xs text-muted-foreground">{payoutNote[payment.payoutStatus]}</p>
            </div>
          ) : payment.escrowStatus === 'released' ? (
            <p className="text-xs text-muted-foreground text-center">
              Released from escrow
              {payment.releaseDate && new Date(payment.releaseDate) <= new Date()
                ? ` on ${formatDate(payment.releaseDate)}`
                : ''}
              . The transfer to your bank is a separate step that follows.
            </p>
          ) : payment.releaseDate && payment.escrowStatus !== 'frozen' ? (
            <p className="text-xs text-muted-foreground text-center">
              Due to be released from escrow on {formatDate(payment.releaseDate)}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};
