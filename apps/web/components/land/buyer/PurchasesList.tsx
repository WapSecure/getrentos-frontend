'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button, EmptyState, PageErrorState, Pagination, Select } from '@getrentos/ui';
import { AlertTriangle, ChevronRight, Landmark } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { buyerLandKeys } from '@/lib/landSalesQueryKeys';
import { landBuyerService } from '@/services/landBuyerService';
import { LAND_PURCHASE_STATUS_LABELS, type LandPurchaseStatus } from '@/types/landBuyer';
import { PurchaseStatusBadge } from './LandSaleBadges';
import { plotLabel } from './landSaleLogic';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: '', label: 'All purchases' },
  ...(Object.keys(LAND_PURCHASE_STATUS_LABELS) as LandPurchaseStatus[]).map((s) => ({
    value: s,
    label: LAND_PURCHASE_STATUS_LABELS[s],
  })),
];

/** My plot purchases, newest first, with what is due next. */
export const PurchasesList = () => {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const params = {
    page,
    pageSize: PAGE_SIZE,
    status: (status || undefined) as LandPurchaseStatus | undefined,
  };

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: buyerLandKeys.purchaseList(params),
    queryFn: () => unwrap(landBuyerService.listPurchases(params)),
  });
  const purchases = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="w-full sm:w-60">
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          ariaLabel="Filter purchases by status"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : isError ? (
        <PageErrorState
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      ) : purchases.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title={status ? 'No purchases with this status' : 'No plot purchases yet'}
          description="Reserve a plot in a verified estate, then start a purchase on one of its payment plans."
          action={<Button href={LAND_BUYER_ROUTES.LAYOUTS}>Browse estates</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {purchases.map((p) => (
            <li key={p.id}>
              <Link
                href={LAND_BUYER_ROUTES.purchase(p.id)}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {plotLabel(p)} · {p.layoutName}
                    </span>
                    <PurchaseStatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.reference} · {p.planName} · started {formatDate(p.startedAt ?? p.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {formatCurrency(p.amountPaid)} paid of {formatCurrency(p.totalPrice)}
                    {p.outstandingBalance > 0 && (
                      <span className="text-muted-foreground">
                        {' '}
                        · {formatCurrency(p.outstandingBalance)} outstanding
                      </span>
                    )}
                  </p>
                  {p.nextDue && (
                    <p
                      className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${
                        p.nextDue.overdue ? 'text-destructive' : 'text-muted-foreground'
                      }`}
                    >
                      {p.nextDue.overdue && <AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
                      {p.nextDue.overdue ? 'Overdue: ' : 'Next: '}
                      {p.nextDue.label}, {formatCurrency(p.nextDue.amount)} on{' '}
                      {formatDate(p.nextDue.dueDate)}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {total > PAGE_SIZE && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      )}
    </div>
  );
};
