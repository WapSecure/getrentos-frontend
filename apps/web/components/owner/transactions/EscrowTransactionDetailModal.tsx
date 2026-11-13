'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  ShieldAlert,
  LifeBuoy,
  ScrollText,
  ChevronDown,
  User,
  ShieldCheck,
  Cog,
  Clock,
  Banknote,
  XCircle,
  type SgIcon,
} from '@sureground/icons';
import {
  Alert,
  type AlertVariant,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Timeline,
} from '@sureground/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { cancelledBeforePayment } from '@/lib/saleCancellation';
import { stepStates } from '@/lib/stepStates';
import type {
  EscrowSaleTransaction,
  SaleEscrowStatus,
  EscrowActivityLogEntry,
} from '@/types/owner';
import { ROUTES } from '@/lib/constants/auth';
import { LandConveyanceEntry } from '@/components/land/sales/LandConveyanceEntry';

interface EscrowTransactionDetailModalProps {
  transaction: EscrowSaleTransaction | null;
  onClose: () => void;
}

const actorConfig: Record<
  EscrowActivityLogEntry['actor'],
  { label: string; icon: React.ElementType }
> = {
  owner: { label: 'You', icon: User },
  buyer: { label: 'Buyer', icon: User },
  compliance: { label: 'Compliance', icon: ShieldCheck },
  system: { label: 'System', icon: Cog },
};

// Only the states the backend drives a sale through: deposit → held → released. A finished step
// reads in the past tense.
const escrowSteps: {
  key: SaleEscrowStatus;
  label: string;
  description: string;
  doneLabel: string;
  doneDescription: string;
}[] = [
  {
    key: 'deposit_pending',
    label: 'Deposit pending',
    description: 'Waiting for the buyer to pay their deposit to Sureground.',
    doneLabel: 'Deposit paid',
    doneDescription: 'The buyer paid their deposit to Sureground.',
  },
  {
    key: 'funds_held',
    label: 'Funds held',
    description:
      'Deposit received and held safely by Sureground. It is released to you once you have handed over and the buyer confirms.',
    doneLabel: 'Funds held',
    doneDescription:
      'Sureground held the deposit until you had handed over and the buyer confirmed.',
  },
  {
    key: 'released',
    label: 'Released',
    description: 'Funds released to you after all conditions were met.',
    doneLabel: 'Released',
    doneDescription: 'Funds released to you after all conditions were met.',
  },
];

const payoutStatusMeta: Record<
  NonNullable<EscrowSaleTransaction['sellerPayoutStatus']>,
  { title: string; description: string; icon: SgIcon; variant: AlertVariant }
> = {
  PENDING: {
    title: 'Payout pending',
    description: 'Set up your payout account so the sale proceeds can be sent to you.',
    icon: Clock,
    variant: 'warning',
  },
  PROCESSING: {
    title: 'Payout on its way',
    description: 'The transfer has been sent and is waiting on your bank to confirm it.',
    icon: Clock,
    variant: 'info',
  },
  PAID: {
    title: 'Paid out',
    description: 'The sale proceeds have been sent to your payout account.',
    icon: Banknote,
    variant: 'success',
  },
  FAILED: {
    title: 'Payout failed',
    description:
      'The transfer to your payout account didn’t go through. Check your account details.',
    icon: XCircle,
    variant: 'danger',
  },
};

export const EscrowTransactionDetailModal = ({
  transaction,
  onClose,
}: EscrowTransactionDetailModalProps) => {
  const router = useRouter();
  const [showActivityLog, setShowActivityLog] = useState(false);

  if (!transaction) return null;

  const isFrozen = transaction.escrowStatus === 'frozen';
  const isRefunded = transaction.escrowStatus === 'refunded';
  const neverPaid = cancelledBeforePayment(transaction);
  const states = stepStates(
    escrowSteps.map((s) => s.key),
    transaction.escrowStatus
  );
  const payout = transaction.sellerPayoutStatus
    ? payoutStatusMeta[transaction.sellerPayoutStatus]
    : null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        size="lg"
        padded={false}
        className="flex max-h-[88dvh] flex-col overflow-hidden"
      >
        <div className="shrink-0 border-b border-border p-4 pr-12">
          <DialogTitle className="font-semibold text-foreground">
            {transaction.propertyName}
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
            Buyer: {transaction.buyerName}
          </DialogDescription>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
          <div className="flex items-center justify-between rounded-lg bg-secondary/60 p-3">
            <span className="text-sm text-muted-foreground">Sale price</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(transaction.salePrice)}
            </span>
          </div>

          {isFrozen ? (
            <Alert variant="danger" icon={ShieldAlert} title="Payment on hold: dispute open">
              {transaction.disputeReason ||
                'A dispute has been raised on this transaction. Funds are held until resolution.'}
            </Alert>
          ) : neverPaid ? (
            <Alert variant="neutral" icon={ShieldAlert} title="Sale cancelled">
              This sale was cancelled before the buyer paid a deposit, so no money was taken or
              refunded.
            </Alert>
          ) : isRefunded ? (
            <Alert variant="neutral" icon={ShieldAlert} title="Payment refunded">
              Sureground refunded the buyer&apos;s payment and this sale will not go ahead.
            </Alert>
          ) : (
            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">Payment progress</h4>
              <Timeline
                aria-label="Payment progress"
                items={escrowSteps.map((step, index) => ({
                  id: step.key,
                  title: states[index] === 'done' ? step.doneLabel : step.label,
                  description: states[index] === 'done' ? step.doneDescription : step.description,
                  state: states[index],
                }))}
              />
            </div>
          )}

          {/* Land sales only: their conveyance steps gate the payout. */}
          <LandConveyanceEntry transaction={transaction} />

          <Alert variant="info" icon={Lock}>
            Sureground holds the buyer’s money and releases it to you once you have handed over and
            the buyer confirms (for a home, the keys and vacant possession; for land, the conveyance
            steps). It is never released on a timer, and a dispute keeps it held until it is
            resolved.
          </Alert>

          {transaction.releasedAt && (
            <p className="text-center text-xs text-muted-foreground">
              Funds released on {formatDate(transaction.releasedAt)}
            </p>
          )}

          {payout && (
            <Alert variant={payout.variant} icon={payout.icon} title={payout.title}>
              {payout.description}
            </Alert>
          )}

          <div className="overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setShowActivityLog((v) => !v)}
              aria-expanded={showActivityLog}
              className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ScrollText className="h-4 w-4 text-muted-foreground" />
                Activity log
                <span className="text-xs font-normal text-muted-foreground">
                  ({transaction.activityLog.length} events)
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${showActivityLog ? 'rotate-180' : ''}`}
              />
            </button>

            {showActivityLog && (
              <div className="divide-y divide-border border-t border-border">
                {transaction.activityLog.map((entry) => {
                  const actor = actorConfig[entry.actor];
                  const ActorIcon = actor.icon;
                  return (
                    <div key={entry.id} className="flex items-start gap-3 p-3">
                      <div className="shrink-0 rounded-lg bg-secondary p-1.5">
                        <ActorIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-foreground">{entry.action}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {actor.label} · {formatDate(entry.timestamp, 'long')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-border p-4">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push(ROUTES.OWNER_MESSAGES)}
            icon={<LifeBuoy className="h-4 w-4" />}
          >
            Contact support
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
