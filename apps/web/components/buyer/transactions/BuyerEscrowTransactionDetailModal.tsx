'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Lock,
  ShieldAlert,
  LifeBuoy,
  ScrollText,
  ChevronDown,
  User,
  ShieldCheck,
  Cog,
  Wallet,
} from 'lucide-react';
import { Alert, Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type {
  BuyerEscrowTransaction,
  BuyerEscrowStatus,
  EscrowActivityLogEntry,
} from '@/types/buyer';
import { ROUTES } from '@/lib/constants/auth';
import { LandConveyanceEntry } from '@/components/land/buyer/LandConveyanceEntry';

interface BuyerEscrowTransactionDetailModalProps {
  transaction: BuyerEscrowTransaction | null;
  onClose: () => void;
  onMakePayment: (transactionId: string, stage: 'deposit' | 'final') => void;
  /** A deposit or final payment is on its way to the server. */
  isPaying?: boolean;
}

const actorConfig: Record<
  EscrowActivityLogEntry['actor'],
  { label: string; icon: React.ElementType }
> = {
  owner: { label: 'Owner', icon: User },
  buyer: { label: 'You', icon: User },
  compliance: { label: 'Compliance', icon: ShieldCheck },
  system: { label: 'System', icon: Cog },
};

const escrowSteps: { key: BuyerEscrowStatus; label: string; description: string }[] = [
  {
    key: 'deposit_pending',
    label: 'Deposit Pending',
    description: 'Pay your deposit to GetRentos, which holds it safely until the sale completes.',
  },
  {
    key: 'funds_held',
    label: 'Funds Held',
    description: 'Your deposit is received and held safely by GetRentos.',
  },
  {
    key: 'verification',
    label: 'Verification',
    description: 'Ownership and transfer documents are under compliance review.',
  },
  {
    key: 'final_payment',
    label: 'Final Payment',
    description: 'Remit the balance of the purchase price to proceed.',
  },
  {
    key: 'released',
    label: 'Released',
    description: 'Funds released to the owner and ownership transfer completed.',
  },
];

export const BuyerEscrowTransactionDetailModal = ({
  transaction,
  onClose,
  onMakePayment,
  isPaying = false,
}: BuyerEscrowTransactionDetailModalProps) => {
  const router = useRouter();
  const [showActivityLog, setShowActivityLog] = useState(false);

  if (!transaction) return null;

  const isFrozen = transaction.escrowStatus === 'frozen' || transaction.escrowStatus === 'disputed';
  const isRefunded = transaction.escrowStatus === 'refunded';
  const activeIndex = escrowSteps.findIndex((s) => s.key === transaction.escrowStatus);
  const canDeposit = transaction.escrowStatus === 'deposit_pending';
  const canPayFinal = transaction.escrowStatus === 'final_payment';

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent padded={false} className="flex flex-col overflow-hidden sm:max-w-lg">
        <div className="p-4 pr-12 border-b border-border shrink-0">
          <DialogTitle className="font-semibold text-foreground">
            {transaction.propertyTitle}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Owner: {transaction.ownerName}
          </DialogDescription>
        </div>

        <div className="p-4 space-y-5 overflow-y-auto flex-1 min-h-0">
          <div className="p-3 rounded-lg bg-secondary flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Purchase Price</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(transaction.purchasePrice)}
            </span>
          </div>

          {isFrozen ? (
            <Alert variant="danger" icon={ShieldAlert} title="Payment on hold: dispute open">
              {transaction.disputeReason ||
                'A dispute has been raised on this transaction. Funds are held until resolution.'}
            </Alert>
          ) : isRefunded ? (
            <Alert variant="neutral" icon={ShieldAlert} title="Payment refunded">
              This transaction was refunded and cannot accept further payments.
            </Alert>
          ) : (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Payment progress</h4>
              <div className="space-y-0">
                {escrowSteps.map((step, index) => {
                  const isDone = index < activeIndex || transaction.escrowStatus === 'released';
                  const isActive =
                    index === activeIndex && transaction.escrowStatus !== 'released';
                  const isLast = index === escrowSteps.length - 1;
                  return (
                    <div key={step.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            isDone
                              ? 'bg-primary text-primary-foreground'
                              : isActive
                                ? 'bg-primary/20 text-primary ring-2 ring-primary'
                                : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {isDone ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <span className="text-xs font-semibold">{index + 1}</span>
                          )}
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 flex-1 min-h-6 ${isDone ? 'bg-primary' : 'bg-border'}`}
                          />
                        )}
                      </div>
                      <div className="pb-5 flex-1">
                        <p
                          className={`text-sm font-medium ${
                            isDone || isActive ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.description}
                        </p>
                        {isActive && step.key === 'deposit_pending' && canDeposit && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="mt-2"
                            icon={<Wallet className="w-3.5 h-3.5" />}
                            isLoading={isPaying}
                            onClick={() => onMakePayment(transaction.id, 'deposit')}
                          >
                            Make Deposit Payment
                          </Button>
                        )}
                        {isActive && step.key === 'final_payment' && canPayFinal && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="mt-2"
                            icon={<Wallet className="w-3.5 h-3.5" />}
                            isLoading={isPaying}
                            onClick={() => onMakePayment(transaction.id, 'final')}
                          >
                            Pay Final Balance
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Land sales only: renders nothing for any other property. */}
          <LandConveyanceEntry transaction={transaction} />

          <Alert variant="info" icon={Lock}>
            The money you pay is held safely by GetRentos and only paid to the owner once all
            verification conditions are met: protecting both you and the seller.
          </Alert>

          {transaction.releasedAt && (
            <p className="text-xs text-muted-foreground text-center">
              Transaction completed on {formatDate(transaction.releasedAt)}
            </p>
          )}

          <div className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              aria-expanded={showActivityLog}
              onClick={() => setShowActivityLog((v) => !v)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ScrollText className="w-4 h-4 text-muted-foreground" />
                Activity Log
                <span className="text-xs font-normal text-muted-foreground">
                  ({transaction.activityLog.length} events)
                </span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${showActivityLog ? 'rotate-180' : ''}`}
              />
            </button>

            {showActivityLog && (
              <div className="border-t border-border divide-y divide-border">
                {transaction.activityLog.map((entry) => {
                  const actor = actorConfig[entry.actor];
                  const ActorIcon = actor.icon;
                  return (
                    <div key={entry.id} className="flex items-start gap-3 p-3">
                      <div className="p-1.5 rounded-lg bg-secondary shrink-0">
                        <ActorIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-foreground">{entry.action}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
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

        <div className="p-4 border-t border-border flex gap-3 shrink-0">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            icon={<LifeBuoy className="w-4 h-4" />}
            onClick={() => router.push(ROUTES.BUYER_MESSAGES)}
          >
            Contact Support
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
