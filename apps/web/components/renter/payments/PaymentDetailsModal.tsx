'use client';

import { CheckCircle, Shield, Download, MessageCircle } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  DescriptionList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  type DescriptionItem,
} from '@getrentos/ui';
import { escrowStatusBadges, paymentStatusBadges } from '@/lib/statusBadge';
import { formatCurrency, formatLagosDate } from '@/lib/format';
import { InvoiceLines, type InvoiceLine } from '@/components/shared/InvoiceLines';
import { leftToPay } from './PaymentCard';

interface Payment {
  id: string;
  propertyName: string;
  amount: number;
  amountPaid?: number;
  outstanding?: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue' | 'processing';
  method?: 'card' | 'bank_transfer' | 'wallet';
  receiptUrl?: string;
  description: string;
  dueDate: string;
  escrowStatus: 'not_funded' | 'held' | 'pending_review' | 'released' | 'frozen';
  releaseDate?: string;
  heldReason?: string;
  reference?: string;
  feeNaira?: number;
  totalChargedNaira?: number;
  heldAmountNaira?: number;
  resumeCheckout?: { url: string; reference: string; expiresAt: string };
  periodStart?: string;
  periodEnd?: string;
  lines?: InvoiceLine[];
}

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  onDownloadReceipt: (id: string) => void;
  onDispute: (id: string) => void;
  onConfirmMoveIn: (id: string) => void;
}

/** How the renter chose to pay. "Wallet" is not a GetRentos balance, so it is not called one. */
const METHOD_LABEL: Record<NonNullable<Payment['method']>, string> = {
  card: 'Card',
  bank_transfer: 'Bank transfer',
  wallet: 'Other payment method',
};

export const PaymentDetailsModal = ({
  isOpen,
  onClose,
  payment,
  onDownloadReceipt,
  onDispute,
  onConfirmMoveIn,
}: PaymentDetailsModalProps) => {
  const status = paymentStatusBadges[payment.status];
  const isPaid = payment.status === 'paid';
  const isPayable = payment.status === 'pending' || payment.status === 'overdue';
  const isHeld = isPaid && payment.escrowStatus === 'held';
  const left = leftToPay(payment);
  const paidSoFar = payment.amountPaid ?? 0;
  const reference = payment.resumeCheckout?.reference ?? payment.reference;

  const facts: DescriptionItem[] = [
    { label: 'Charge', value: payment.description },
    { label: 'Charge amount', value: formatCurrency(payment.amount) },
    ...(!isPaid && paidSoFar > 0
      ? [{ label: 'Paid so far', value: formatCurrency(paidSoFar) }]
      : []),
    ...(isPayable ? [{ label: 'Still to pay', value: formatCurrency(left) }] : []),
    { label: 'Due date', value: formatLagosDate(payment.dueDate, 'long') },
    ...(isPaid ? [{ label: 'Paid on', value: formatLagosDate(payment.date, 'long') }] : []),
    ...(isPaid && payment.method
      ? [{ label: 'Paid with', value: METHOD_LABEL[payment.method] ?? 'Other payment method' }]
      : []),
    ...(isPaid && payment.feeNaira !== undefined
      ? [
          {
            label: 'Card or bank fee',
            value: formatCurrency(payment.feeNaira),
            hint: 'Charged by the payment company and paid on top, so your landlord gets the full amount.',
          },
        ]
      : []),
    ...(isPaid && payment.totalChargedNaira !== undefined
      ? [{ label: 'Total charged', value: formatCurrency(payment.totalChargedNaira) }]
      : []),
    ...(payment.heldAmountNaira
      ? [{ label: 'Held by GetRentos', value: formatCurrency(payment.heldAmountNaira) }]
      : []),
    ...(reference
      ? [
          {
            label: 'Payment reference',
            value: <span className="select-all font-mono text-xs">{reference}</span>,
            hint: 'Quote this if you contact support.',
          },
        ]
      : []),
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 sm:p-0">
        <div className="p-4 pr-12 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">Payment details</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {payment.propertyName}
          </DialogDescription>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary">
            <div>
              <p className="text-xs text-muted-foreground">
                {isPayable ? 'Still to pay' : 'Amount'}
              </p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(isPayable ? left : payment.amount)}
              </p>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          <InvoiceLines
            lines={payment.lines}
            periodStart={payment.periodStart}
            periodEnd={payment.periodEnd}
          />

          <DescriptionList items={facts} layout="rows" />

          {payment.escrowStatus !== 'not_funded' && (
            <Alert variant="info" icon={Shield} title="Where your money is">
              {escrowStatusBadges[payment.escrowStatus]?.label ?? payment.escrowStatus}
              {payment.escrowStatus === 'held' && (
                <p className="text-xs mt-1">
                  Held under GetRentos Payment Protection so you have the home in hand first.{' '}
                  {payment.releaseDate ? (
                    <>
                      It releases to your landlord on {formatLagosDate(payment.releaseDate)}, or
                      sooner — the moment you confirm you&apos;ve moved in.
                    </>
                  ) : (
                    <>It stays held until you confirm you&apos;ve moved in.</>
                  )}
                </p>
              )}
            </Alert>
          )}

          {(isHeld || payment.receiptUrl) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {isHeld && (
                <Button
                  variant="primary"
                  className="flex-1"
                  icon={<CheckCircle className="w-4 h-4" />}
                  onClick={() => onConfirmMoveIn(payment.id)}
                >
                  Confirm move-in
                </Button>
              )}
              {payment.receiptUrl && (
                <Button
                  variant="outline"
                  className="flex-1"
                  icon={<Download className="w-4 h-4" />}
                  onClick={() => onDownloadReceipt(payment.id)}
                >
                  Download receipt
                </Button>
              )}
              {isHeld && (
                <Button
                  variant="ghost"
                  icon={<MessageCircle className="w-4 h-4" />}
                  onClick={() => onDispute(payment.id)}
                >
                  Report a problem
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
