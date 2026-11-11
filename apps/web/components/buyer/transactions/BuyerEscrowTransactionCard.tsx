'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert } from '@sureground/icons';
import { Badge, Timeline } from '@sureground/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { stepStates } from '@/lib/stepStates';
import type { BuyerEscrowTransaction, BuyerEscrowStatus } from '@/types/buyer';

// VERIFICATION_PENDING and SETTLEMENT_PENDING exist in the enum but no transaction ever enters them, so they are not shown as steps.
const escrowSteps: { key: BuyerEscrowStatus; label: string }[] = [
  { key: 'deposit_pending', label: 'Deposit pending' },
  { key: 'funds_held', label: 'Funds held' },
  { key: 'released', label: 'Released' },
];

const statusLabels: Record<BuyerEscrowStatus, string> = {
  deposit_pending: 'Deposit pending',
  funds_held: 'Funds held',
  released: 'Completed',
  frozen: 'Frozen: dispute',
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
  const isFrozen = transaction.escrowStatus === 'frozen';
  const isRefunded = transaction.escrowStatus === 'refunded';
  const states = stepStates(
    escrowSteps.map((s) => s.key),
    transaction.escrowStatus,
    isFrozen ? 'blocked' : isRefunded ? 'skipped' : null
  );

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
        <Timeline
          orientation="horizontal"
          aria-label="Payment progress"
          items={escrowSteps.map((step, index) => ({
            id: step.key,
            title: step.label,
            state: states[index],
          }))}
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Opened {formatDate(transaction.createdAt)}
        </p>
      </div>
    </motion.div>
  );
};
