'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { Badge } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type { BuyerEscrowTransaction, BuyerEscrowStatus } from '@/types/buyer';

const escrowSteps: { key: BuyerEscrowStatus; label: string }[] = [
  { key: 'deposit_pending', label: 'Deposit Pending' },
  { key: 'funds_held', label: 'Funds Held' },
  { key: 'verification', label: 'Verification' },
  { key: 'final_payment', label: 'Final Payment' },
  { key: 'released', label: 'Released' },
];

const statusLabels: Record<BuyerEscrowStatus, string> = {
  deposit_pending: 'Deposit Pending',
  funds_held: 'Funds Held',
  verification: 'Verification',
  final_payment: 'Final Payment',
  released: 'Completed',
  frozen: 'Frozen: Dispute',
  disputed: 'Dispute Open',
  refunded: 'Refunded',
};

interface BuyerEscrowTransactionCardProps {
  transaction: BuyerEscrowTransaction;
  onClick: () => void;
  delay?: number;
}

export const BuyerEscrowTransactionCard = ({
  transaction,
  onClick,
  delay = 0,
}: BuyerEscrowTransactionCardProps) => {
  const stepIndex = escrowSteps.findIndex((s) => s.key === transaction.escrowStatus);
  const isFrozen = transaction.escrowStatus === 'frozen' || transaction.escrowStatus === 'disputed';
  const isRefunded = transaction.escrowStatus === 'refunded';
  const progressPct = isFrozen || isRefunded ? 0 : ((stepIndex + 1) / escrowSteps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="bg-card rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 border border-border p-4 cursor-pointer hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{transaction.propertyTitle}</h3>
          <p className="text-xs text-muted-foreground truncate">Owner: {transaction.ownerName}</p>
        </div>
        <Badge
          variant={
            isFrozen
              ? 'danger'
              : isRefunded
                ? 'neutral'
                : transaction.escrowStatus === 'released'
                  ? 'success'
                  : 'info'
          }
          icon={
            isFrozen || isRefunded ? (
              <ShieldAlert className="w-3 h-3" />
            ) : (
              <ShieldCheck className="w-3 h-3" />
            )
          }
        >
          {statusLabels[transaction.escrowStatus]}
        </Badge>
      </div>

      <p className="text-lg font-bold text-primary mt-3">
        {formatCurrency(transaction.purchasePrice, { compact: true })}
      </p>

      <div className="mt-3">
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFrozen ? 'bg-destructive' : isRefunded ? 'bg-muted-foreground' : 'bg-primary'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Opened {formatDate(transaction.createdAt)}
        </p>
      </div>
    </motion.div>
  );
};
