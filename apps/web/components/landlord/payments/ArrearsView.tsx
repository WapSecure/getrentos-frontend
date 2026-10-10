'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { Badge, EmptyState, Pagination } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const PAGE_SIZE = 10;

const daysOverdue = (dueDate: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / MS_PER_DAY));

/** The arrears ladder rung a charge sits on, by how long it has run overdue. */
const ladderStage = (days: number): { label: string; variant: 'warning' | 'danger' } =>
  days >= 30
    ? { label: 'Seriously overdue', variant: 'danger' }
    : days >= 14
      ? { label: 'Escalating', variant: 'danger' }
      : { label: 'Overdue', variant: 'warning' };

export function ArrearsView() {
  const [page, setPage] = useState(1);
  const { data } = useQuery({
    queryKey: [
      ...landlordKeys.payments('overdue'),
      { page, pageSize: PAGE_SIZE, sort: 'due_date_asc' },
    ],
    queryFn: () =>
      unwrap(
        landlordService.listPayments({
          status: 'overdue',
          sort: 'due_date_asc',
          page,
          pageSize: PAGE_SIZE,
        })
      ),
  });
  const payments = data?.items ?? [];
  const total = data?.total ?? 0;

  const { data: summary } = useQuery({
    queryKey: landlordKeys.arrearsSummary,
    queryFn: () => unwrap(landlordService.getArrearsSummary()),
  });
  const totalOverdue = summary?.totalOverdue ?? 0;
  const overdueCount = summary?.overdueCount ?? total;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Arrears</h1>
        <p className="text-muted-foreground mt-1">
          Rent payments flagged overdue by the automatic arrears check, oldest first
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total in arrears</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalOverdue)}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {overdueCount} payment{overdueCount === 1 ? '' : 's'} overdue
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12">
          <EmptyState
            icon={AlertTriangle}
            title="Nothing in arrears"
            description="Overdue rent payments will appear here automatically once flagged past their due date."
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {payments.map((payment) => {
            const overdueDays = daysOverdue(payment.dueDate);
            const stage = ladderStage(overdueDays);
            const isLateFee = payment.category === 'late_fee';
            return (
              <div key={payment.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {payment.tenantName || 'Tenant'} · {payment.propertyName} ({payment.unitName})
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isLateFee ? 'Late fee · ' : ''}Due {formatDate(payment.dueDate)} ·{' '}
                    {overdueDays} day{overdueDays === 1 ? '' : 's'} overdue
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(payment.amount)}
                  </span>
                  {payment.lateFeeApplied && <Badge variant="neutral">Late fee added</Badge>}
                  {isLateFee ? (
                    <Badge variant="danger">Late fee</Badge>
                  ) : (
                    <Badge variant={stage.variant}>{stage.label}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </>
  );
}
