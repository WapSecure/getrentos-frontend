'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { Badge, Card } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import type { EscrowSaleTransaction, SaleEscrowStatus } from '@/types/owner';

// Only the states the backend drives a sale through: deposit → held → released.
const escrowSteps: { key: SaleEscrowStatus; label: string }[] = [
  { key: 'deposit_pending', label: 'Deposit Pending' },
  { key: 'funds_held', label: 'Funds Held' },
  { key: 'released', label: 'Released' },
];

const statusLabels: Record<SaleEscrowStatus, string> = {
  deposit_pending: 'Deposit Pending',
  funds_held: 'Funds Held',
  verification: 'Verification',
  final_payment: 'Final Payment',
  released: 'Released',
  frozen: 'Frozen: Dispute',
  disputed: 'Dispute Open',
  refunded: 'Refunded',
};

interface EscrowTransactionCardProps {
  transaction: EscrowSaleTransaction;
  onClick: () => void;
  delay?: number;
}

export const EscrowTransactionCard = ({
  transaction,
  onClick,
  delay = 0,
}: EscrowTransactionCardProps) => {
  const stepIndex = escrowSteps.findIndex((s) => s.key === transaction.escrowStatus);
  const isFrozen = transaction.escrowStatus === 'frozen' || transaction.escrowStatus === 'disputed';
  const isRefunded = transaction.escrowStatus === 'refunded';
  const progressPct = isFrozen || isRefunded ? 0 : ((stepIndex + 1) / escrowSteps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card interactive className="rounded-2xl p-4">
        <button
          type="button"
          onClick={onClick}
          aria-label={`Open ${transaction.propertyName}`}
          className="absolute inset-0 z-10 rounded-2xl focus:outline-none"
        />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">{transaction.propertyName}</h3>
            <p className="truncate text-xs text-muted-foreground">Buyer: {transaction.buyerName}</p>
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
                <ShieldAlert className="h-3 w-3" />
              ) : (
                <ShieldCheck className="h-3 w-3" />
              )
            }
            className="whitespace-nowrap"
          >
            {statusLabels[transaction.escrowStatus]}
          </Badge>
        </div>

        <p className="mt-3 text-lg font-bold text-primary">
          {formatCurrency(transaction.salePrice, { compact: true })}
        </p>

        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isFrozen ? 'bg-destructive' : isRefunded ? 'bg-muted-foreground' : 'bg-primary'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Opened {formatDate(transaction.createdAt)}
          </p>
        </div>
      </Card>
    </motion.div>
  );
};
