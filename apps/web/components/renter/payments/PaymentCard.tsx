'use client';

import { ChevronRight, Download, Shield, Calendar } from 'lucide-react';
import { Badge, Button, IconButton } from '@sureground/ui';
import { formatCurrency, formatLagosDate } from '@/lib/format';
import { paymentStatusBadges } from '@/lib/statusBadge';

interface Payment {
  id: string;
  propertyName: string;
  amount: number;
  amountPaid?: number;
  outstanding?: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue' | 'processing';
  receiptUrl?: string;
  description: string;
  dueDate: string;
  escrowStatus: 'not_funded' | 'held' | 'pending_review' | 'released' | 'frozen';
  releaseDate?: string;
  heldReason?: string;
  /** A checkout the tenant opened and closed, which they can go back to. */
  resumeCheckout?: { url: string; reference: string; expiresAt: string };
}

interface PaymentCardProps {
  payment: Payment;
  onViewDetails: () => void;
  onPayNow: () => void;
  onDownloadReceipt: () => void;
  onDispute: () => void;
  onConfirmMoveIn: () => void;
}

/** Plain-language state of money that has been collected. */
const escrowLabel = (status: Payment['escrowStatus']): string =>
  ({
    not_funded: 'not paid yet',
    held: 'held by Sureground',
    pending_review: 'under review',
    released: 'released to your landlord',
    frozen: 'on hold while a problem is reviewed',
  })[status] ?? status;

/** What is still to pay on a charge, after part-payments and credit. */
export const leftToPay = (p: { amount: number; amountPaid?: number; outstanding?: number }) =>
  p.outstanding ?? p.amount - (p.amountPaid ?? 0);

export const PaymentCard = ({
  payment,
  onViewDetails,
  onPayNow,
  onDownloadReceipt,
  onDispute,
  onConfirmMoveIn,
}: PaymentCardProps) => {
  const status = paymentStatusBadges[payment.status];
  const StatusIcon = status.icon ?? Calendar;

  const isPayable = payment.status === 'pending' || payment.status === 'overdue';
  const isHeld = payment.status === 'paid' && payment.escrowStatus === 'held';
  // The tenant closed Paystack's page: they go back to the same checkout rather
  // than wait for it to lapse (or risk opening a second one).
  const resume = payment.status === 'processing' ? payment.resumeCheckout : undefined;
  const left = leftToPay(payment);

  return (
    <article className="group p-4 transition-colors hover:bg-secondary/50 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <StatusIcon className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1 sm:min-w-[16rem]">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{payment.propertyName}</h3>
            <Badge variant={status.variant} icon={<StatusIcon className="h-3 w-3" />}>
              {status.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{payment.description}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              <span>
                {payment.status === 'paid'
                  ? `Paid ${formatLagosDate(payment.date)}`
                  : `Due ${formatLagosDate(payment.dueDate)}`}
              </span>
            </div>
            {payment.status === 'paid' && (
              <div className="flex items-start gap-1">
                <Shield className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                <span>
                  Your money: {escrowLabel(payment.escrowStatus)}
                  {isHeld && payment.releaseDate
                    ? ` · releases to your landlord on ${formatLagosDate(payment.releaseDate)}`
                    : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:ml-auto">
          {/* Headline is what is still to pay on an open charge, the same as mobile. */}
          <div className="text-right">
            <p className="text-lg font-bold text-primary">
              {formatCurrency(isPayable ? left : payment.amount)}
            </p>
            {isPayable && left !== payment.amount && (
              <p className="text-xs text-muted-foreground">
                left of {formatCurrency(payment.amount)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isPayable && (
              <Button
                size="sm"
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onPayNow();
                }}
                className="whitespace-nowrap"
              >
                Pay now
              </Button>
            )}
            {resume && (
              <Button
                size="sm"
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.assign(resume.url);
                }}
                className="whitespace-nowrap"
              >
                Resume payment
              </Button>
            )}
            {isHeld && (
              <Button
                size="sm"
                variant="primary"
                onClick={(event) => {
                  event.stopPropagation();
                  onConfirmMoveIn();
                }}
                className="whitespace-nowrap"
              >
                Confirm move-in
              </Button>
            )}
            {isHeld && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  onDispute();
                }}
                className="text-muted-foreground"
              >
                Report a problem
              </Button>
            )}
            {payment.receiptUrl && (
              <IconButton
                size="sm"
                label="Download receipt"
                icon={<Download aria-hidden="true" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadReceipt();
                }}
              />
            )}
            <IconButton
              size="sm"
              label="View payment details"
              icon={<ChevronRight aria-hidden="true" />}
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
};
