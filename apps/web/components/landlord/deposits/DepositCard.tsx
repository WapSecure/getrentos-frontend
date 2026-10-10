'use client';

import { Badge, type BadgeVariant } from '@getrentos/ui';
import { PiggyBank, ShieldCheck } from 'lucide-react';
import {
  DEPOSIT_STATUS_LABELS,
  type DepositHoldListItem,
  type DepositStatus,
} from '@/services/depositService';

const STATUS_VARIANT: Record<DepositStatus, BadgeVariant> = {
  HELD: 'info',
  PARTIALLY_RETURNED: 'warning',
  RETURNED: 'success',
};

const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

interface DepositCardProps {
  deposit: DepositHoldListItem;
  onOpen: (id: string) => void;
}

export const DepositCard = ({ deposit, onOpen }: DepositCardProps) => (
  <button
    type="button"
    onClick={() => onOpen(deposit.id)}
    className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 cursor-pointer"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <PiggyBank className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate font-semibold text-foreground">
          {deposit.propertyTitle ?? 'Property'}
        </span>
      </div>
      <Badge variant={STATUS_VARIANT[deposit.status]}>
        {DEPOSIT_STATUS_LABELS[deposit.status]}
      </Badge>
    </div>

    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-xs text-muted-foreground">Held</p>
        <p className="font-semibold text-foreground">{formatNaira(deposit.amount)}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Returnable</p>
        <p className="font-semibold text-foreground">{formatNaira(deposit.returnable)}</p>
      </div>
    </div>

    {deposit.heldByGetRentos && (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Held by GetRentos
      </div>
    )}
  </button>
);
