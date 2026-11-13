'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Wallet } from '@sureground/icons';
import { Badge, Button, Card } from '@sureground/ui';
import { AcquisitionStatusBadges } from '@/components/shared/purchases/AcquisitionStatusBadges';
import { PURCHASE_ROUTES } from '@/lib/constants/purchaseRoutes';
import { formatCurrency, formatDate } from '@/lib/format';
import { RecordIconTile } from '@/components/shared/records/RecordParts';
import type { BuyerEscrowTransaction, BuyerEscrowStatus } from '@/types/buyer';

// Only the deposit is held under Payment Protection, so these name the deposit, not the price.
const statusLabels: Record<BuyerEscrowStatus, string> = {
  deposit_pending: 'Deposit to pay',
  funds_held: 'Deposit held',
  released: 'Deposit released',
  frozen: 'On hold: dispute',
  refunded: 'Refunded',
};

/** The deposit line says what happened to the deposit; only a held one is under Payment Protection. */
const depositLabels: Record<BuyerEscrowStatus, string> = {
  deposit_pending: 'Deposit due',
  funds_held: 'Deposit under Payment Protection',
  released: 'Deposit released',
  frozen: 'Deposit on hold under Payment Protection',
  refunded: 'Deposit refunded',
};

interface BuyerEscrowTransactionCardProps {
  transaction: BuyerEscrowTransaction;
  /** Shown while the deposit is owed; opens the payment dialog. */
  onPayDeposit?: () => void;
  delay?: number;
}

/** A purchase in the list; the whole card opens its workspace. */
export const BuyerEscrowTransactionCard = ({
  transaction,
  onPayDeposit,
  delay = 0,
}: BuyerEscrowTransactionCardProps) => {
  const isFrozen = transaction.escrowStatus === 'frozen';
  const isRefunded = transaction.escrowStatus === 'refunded';
  const canPay = transaction.escrowStatus === 'deposit_pending' && onPayDeposit;
  const deposit = transaction.depositAmount ?? transaction.purchasePrice;
  // Cancelled before any deposit arrived: nothing was refunded because nothing was paid.
  const neverPaid = isRefunded && transaction.statuses?.moneyStatus.code === 'NOT_DUE';
  const statuses =
    neverPaid && transaction.statuses
      ? {
          ...transaction.statuses,
          moneyStatus: { ...transaction.statuses.moneyStatus, label: 'Deposit: never paid' },
        }
      : transaction.statuses;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card interactive className="group rounded-2xl p-4 hover:border-primary/30 sm:p-5">
        <Link
          href={PURCHASE_ROUTES.buyerWorkspace(transaction.id)}
          aria-label={`Open ${transaction.propertyTitle}`}
          className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        />
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <RecordIconTile icon={isFrozen || isRefunded ? ShieldAlert : ShieldCheck} />
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
                {transaction.propertyTitle}
              </h3>
              <p className="truncate text-xs text-muted-foreground">
                Seller: {transaction.ownerName}
              </p>
            </div>
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
            {neverPaid ? 'Cancelled' : statusLabels[transaction.escrowStatus]}
          </Badge>
        </div>

        <p className="mt-4 text-lg font-bold tabular-nums text-primary">
          {formatCurrency(transaction.purchasePrice, { compact: true })}
        </p>
        <p className="text-xs text-muted-foreground">
          {neverPaid
            ? 'Cancelled before a deposit was paid'
            : `${depositLabels[transaction.escrowStatus]}: ${formatCurrency(deposit, { compact: true })}`}
        </p>

        {statuses && <AcquisitionStatusBadges statuses={statuses} className="mt-3" />}
        {transaction.nextAction && (
          <p
            className={
              transaction.nextAction.waitingForYou
                ? 'mt-2 text-sm font-medium text-foreground'
                : 'mt-2 text-sm text-muted-foreground'
            }
          >
            {transaction.nextAction.waitingForYou ? 'Waiting for you: ' : 'Next: '}
            {transaction.nextAction.label}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            Opened {formatDate(transaction.createdAt)}
          </p>
          {canPay && (
            // Above the card's link, so it takes its own click.
            <Button
              size="sm"
              className="relative z-20"
              icon={<Wallet className="h-3.5 w-3.5" />}
              onClick={onPayDeposit}
            >
              Pay deposit
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
