'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Check,
  Lock,
  ShieldAlert,
  LifeBuoy,
  ScrollText,
  ChevronDown,
  User,
  ShieldCheck,
  Cog,
} from 'lucide-react';
import { Button } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type {
  EscrowSaleTransaction,
  SaleEscrowStatus,
  EscrowActivityLogEntry,
} from '@/types/owner';
import { ROUTES } from '@/lib/constants/auth';

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

const escrowSteps: { key: SaleEscrowStatus; label: string; description: string }[] = [
  {
    key: 'deposit_pending',
    label: 'Deposit Pending',
    description: 'Awaiting buyer earnest deposit into escrow.',
  },
  {
    key: 'funds_held',
    label: 'Funds Held',
    description: 'Deposit confirmed and held securely in escrow.',
  },
  {
    key: 'verification',
    label: 'Verification',
    description: 'Ownership and transfer documents under compliance review.',
  },
  {
    key: 'final_payment',
    label: 'Final Payment',
    description: 'Buyer remitting the balance of the sale price.',
  },
  {
    key: 'released',
    label: 'Released',
    description: 'Funds released to you after all conditions were met.',
  },
];

export const EscrowTransactionDetailModal = ({
  transaction,
  onClose,
}: EscrowTransactionDetailModalProps) => {
  const router = useRouter();
  const [showActivityLog, setShowActivityLog] = useState(false);

  if (!transaction) return null;

  const isFrozen = transaction.escrowStatus === 'frozen';
  const activeIndex = escrowSteps.findIndex((s) => s.key === transaction.escrowStatus);

  return (
    <AnimatePresence>
      {transaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-semibold text-foreground">{transaction.propertyName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Buyer: {transaction.buyerName}
                </p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-5 overflow-y-auto flex-1">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sale Price</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(transaction.salePrice)}
                </span>
              </div>

              {isFrozen ? (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-red-700 dark:text-red-400">
                      Escrow frozen — dispute active
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
                      {transaction.disputeReason ||
                        'A dispute has been raised on this transaction. Funds are held until resolution.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Escrow Timeline</h4>
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
                                isDone || (isActive && transaction.escrowStatus === 'released')
                                  ? 'bg-primary text-white'
                                  : isActive
                                    ? 'bg-primary/20 text-primary ring-2 ring-primary'
                                    : 'bg-secondary text-gray-400'
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
                                className={`w-0.5 flex-1 min-h-6 ${isDone ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'}`}
                              />
                            )}
                          </div>
                          <div className="pb-5">
                            <p
                              className={`text-sm font-medium ${
                                isDone || isActive ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              {step.label}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-2">
                <Lock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Funds are held and released automatically by GetRentos escrow once all
                  verification and payment conditions are met. Manual release is not available to
                  protect both parties.
                </p>
              </div>

              {transaction.releasedAt && (
                <p className="text-xs text-gray-400 text-center">
                  Funds released on {formatDate(transaction.releasedAt)}
                </p>
              )}

              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowActivityLog((v) => !v)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ScrollText className="w-4 h-4 text-gray-400" />
                    Activity Log
                    <span className="text-xs font-normal text-gray-400">
                      ({transaction.activityLog.length} events)
                    </span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${showActivityLog ? 'rotate-180' : ''}`}
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
                            <p className="text-xs text-gray-400 mt-0.5">
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
                className="flex-1 gap-1.5"
                onClick={() => router.push(ROUTES.OWNER_MESSAGES)}
              >
                <LifeBuoy className="w-4 h-4" />
                Contact Support
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
