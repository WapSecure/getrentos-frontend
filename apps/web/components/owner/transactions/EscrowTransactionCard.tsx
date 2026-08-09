'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import type { EscrowSaleTransaction, SaleEscrowStatus } from '@/types/owner';

const escrowSteps: { key: SaleEscrowStatus; label: string }[] = [
  { key: 'deposit_pending', label: 'Deposit Pending' },
  { key: 'funds_held', label: 'Funds Held' },
  { key: 'verification', label: 'Verification' },
  { key: 'final_payment', label: 'Final Payment' },
  { key: 'released', label: 'Released' },
];

const statusLabels: Record<SaleEscrowStatus, string> = {
  deposit_pending: 'Deposit Pending',
  funds_held: 'Funds Held',
  verification: 'Verification',
  final_payment: 'Final Payment',
  released: 'Released',
  frozen: 'Frozen — Dispute',
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
  const isFrozen = transaction.escrowStatus === 'frozen';
  const progressPct = isFrozen ? 0 : ((stepIndex + 1) / escrowSteps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      className="bg-card rounded-2xl border border-border p-4 cursor-pointer hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{transaction.propertyName}</h3>
          <p className="text-xs text-muted-foreground truncate">Buyer: {transaction.buyerName}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
            isFrozen
              ? 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
              : transaction.escrowStatus === 'released'
                ? 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20'
                : 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
          }`}
        >
          {isFrozen ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
          {statusLabels[transaction.escrowStatus]}
        </span>
      </div>

      <p className="text-lg font-bold text-primary mt-3">
        {formatCurrency(transaction.salePrice, { compact: true })}
      </p>

      <div className="mt-3">
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isFrozen ? 'bg-red-500' : 'bg-primary'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Opened {formatDate(transaction.createdAt)}</p>
      </div>
    </motion.div>
  );
};
