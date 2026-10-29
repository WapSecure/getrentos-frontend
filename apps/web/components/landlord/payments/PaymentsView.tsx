'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  PageErrorState,
  Pagination,
  SearchInput,
  StatGridSkeleton,
  TableSkeleton,
  ToggleChip,
} from '@getrentos/ui';
import { RentCollectionStats } from '@/components/landlord/payments/RentCollectionStats';
import { PaymentsTable } from '@/components/landlord/payments/PaymentsTable';
import { PaymentDetailsModal } from '@/components/landlord/payments/PaymentDetailsModal';
import {
  landlordService,
  type RentCollectionStats as RentCollectionStatsData,
} from '@/services/landlordService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import type { RentPayment, RentPaymentStatus } from '@/types/landlord';

const EMPTY_STATS: RentCollectionStatsData = {
  totalCollected: 0,
  outstandingBalance: 0,
  escrowPending: 0,
  upcomingPayments: 0,
};

const statusFilters: { value: 'all' | RentPaymentStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

const PAGE_SIZE = 10;

export function PaymentsView() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | RentPaymentStatus>('all');
  const [selectedPayment, setSelectedPayment] = useState<RentPayment | null>(null);

  const paymentsQuery = useQuery({
    queryKey: [
      ...landlordKeys.payments(),
      { page, pageSize: PAGE_SIZE, status: filter === 'all' ? undefined : filter },
    ],
    queryFn: () =>
      unwrap(
        landlordService.listPayments({
          status: filter === 'all' ? undefined : filter,
          page,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const { data } = paymentsQuery;
  // Memoised so the filter below has a stable dependency. A bare `?? []` fallback
  // is a new array on every render, which made `filteredPayments` recompute every
  // render: the cost the memo existed to avoid.
  const payments = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;

  const statsQuery = useQuery({
    queryKey: landlordKeys.rentCollectionStats,
    queryFn: () => unwrap(landlordService.getRentCollectionStats()),
  });
  const stats = statsQuery.data ?? EMPTY_STATS;

  const { totalCollected, outstandingBalance, escrowPending, upcomingPayments } = stats;

  // The server filters by status; search stays client-side (not supported by the API).
  const filteredPayments = useMemo(
    () =>
      payments.filter(
        (p) =>
          p.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.propertyName.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [payments, searchQuery]
  );

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground mt-1">
          Track rent collection and when it is paid out to you
        </p>
      </div>

      {statsQuery.isLoading ? (
        <StatGridSkeleton className="mb-6 grid-cols-2" />
      ) : (
        statsQuery.data && (
          <RentCollectionStats
            totalCollected={totalCollected}
            outstandingBalance={outstandingBalance}
            escrowPending={escrowPending}
            upcomingPayments={upcomingPayments}
          />
        )
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          className="flex-1 max-w-sm"
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder="Search this page by tenant or property..."
          label="Search this page by tenant or property"
        />
        <div
          className="flex max-w-full gap-1 overflow-x-auto pb-1"
          role="group"
          aria-label="Filter payments by status"
        >
          {statusFilters.map((option) => (
            <ToggleChip
              key={option.value}
              size="sm"
              pressed={filter === option.value}
              onPressedChange={() => {
                setFilter(option.value);
                setPage(1);
              }}
            >
              {option.label}
            </ToggleChip>
          ))}
        </div>
      </div>

      {paymentsQuery.isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : !data || (statsQuery.isError && !statsQuery.data) ? (
        <PageErrorState
          title="Payment records are unavailable"
          description="We could not load your collections and balances. No figures have been changed."
          onRetry={() => {
            void paymentsQuery.refetch();
            void statsQuery.refetch();
          }}
          isRetrying={paymentsQuery.isFetching || statsQuery.isFetching}
        />
      ) : (
        <PaymentsTable payments={filteredPayments} onViewDetails={setSelectedPayment} />
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

      <PaymentDetailsModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
    </>
  );
}
