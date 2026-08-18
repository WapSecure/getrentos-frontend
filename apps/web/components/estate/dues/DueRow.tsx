'use client';

import { Badge, Button } from '@getrentos/ui';
import type { Due } from '@/types/estate';

const statusVariant: Record<Due['status'], 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
};

const categoryLabels: Record<Due['category'], string> = {
  rent: 'Rent',
  service_charge: 'Service Charge',
  deposit: 'Deposit',
  levy: 'Levy',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );

interface DueRowProps {
  due: Due;
  onMarkPaid: () => void;
  isMarkingPaid?: boolean;
}

export const DueRow = ({ due, onMarkPaid, isMarkingPaid }: DueRowProps) => {
  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {due.unitLabel} — {due.residentName}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {categoryLabels[due.category]} · Due {formatDate(due.dueDate)}
          {due.description ? ` · ${due.description}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold text-foreground">{formatCurrency(due.amount)}</span>
        <Badge variant={statusVariant[due.status]}>
          {due.status.charAt(0).toUpperCase() + due.status.slice(1)}
        </Badge>
        {due.status !== 'paid' && (
          <Button variant="outline" size="sm" disabled={isMarkingPaid} onClick={onMarkPaid}>
            Mark Paid
          </Button>
        )}
      </div>
    </div>
  );
};
